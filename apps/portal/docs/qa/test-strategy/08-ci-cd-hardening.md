# 08 — CI/CD Hardening

> **Estado atual:** pipeline existe, básico. Este documento lista as melhorias aprovadas para o pipeline tornar-se um **quality gate confiável**.

## Estado Atual

Dois workflows:

1. **`.github/workflows/deploy-portal.yml`** (raiz)
   - Build Docker + push GHCR
   - Trigger: push em main com mudanças em `apps/portal/**`

2. **`apps/portal/.github/workflows/test.yml`**
   - Jobs: `test` (Node 18+20), `smoke-tests`, `build`
   - Roda: lint + typecheck + unit + e2e:smoke

**Lacunas:**
- Sem branch protection
- Sem coverage reporting
- Sem SAST (CodeQL)
- Sem Dependabot
- Sem pre-commit hooks
- Sem Testcontainers para integração real
- Sem gate de mutation score

## Melhorias Aprovadas

### 1. Branch Protection em `main`

**Requer permissão admin GitHub.** Passos manuais:

1. GitHub → Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. Habilitar:
   - [x] Require a pull request before merging
     - [x] Require approvals: 1
     - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require status checks to pass before merging
     - [x] Require branches to be up to date before merging
     - Required checks:
       - `test (18.x)`
       - `test (20.x)`
       - `smoke-tests`
       - `build`
       - `CodeQL` (adicionado na melhoria 3)
       - `Codecov` (adicionado na melhoria 2)
   - [x] Require conversation resolution before merging
   - [x] Do not allow bypassing the above settings
   - [ ] Restrict who can push (deixar desmarcado para permitir bot de deploy)

### 2. Coverage + Codecov

**Modificar `apps/portal/vitest.config.ts`:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
  exclude: [
    'node_modules/',
    'src/__tests__/',
    'src/__mocks__/',
    '**/*.d.ts',
    'src/app/**/layout.tsx',  // sem lógica
    'src/app/**/page.tsx',    // só roteamento
  ],
}
```

**Modificar `apps/portal/.github/workflows/test.yml`:**
```yaml
- name: Run tests with coverage
  run: cd apps/portal && npm test -- --run --coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: apps/portal/coverage/lcov.info
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: true
```

**README badge:**
```markdown
[![codecov](https://codecov.io/gh/raphaelbudin-empregga/empregga-kb/branch/main/graph/badge.svg)](...)
```

### 3. CodeQL SAST

**Criar `.github/workflows/security.yml`:**
```yaml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 3 * * 0'  # Domingo 3h UTC

jobs:
  codeql:
    name: CodeQL
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read

    strategy:
      fail-fast: false
      matrix:
        language: [javascript-typescript]

    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended,security-and-quality
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
        with:
          category: '/language:${{ matrix.language }}'

  trivy:
    name: Trivy (Docker scan)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t portal:scan apps/portal
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: portal:scan
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif
```

### 4. Dependabot

**Criar `.github/dependabot.yml`:**
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /apps/portal
    schedule:
      interval: weekly
      day: monday
      time: '06:00'
      timezone: America/Sao_Paulo
    open-pull-requests-limit: 5
    groups:
      testing:
        patterns:
          - vitest
          - '@vitest/*'
          - '@testing-library/*'
          - msw
          - playwright
          - '@playwright/*'
      react:
        patterns:
          - react
          - react-dom
          - next
      dev-tooling:
        patterns:
          - eslint*
          - '@typescript-eslint/*'
          - typescript

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly

  - package-ecosystem: docker
    directory: /apps/portal
    schedule:
      interval: weekly
```

### 5. Husky + lint-staged

**Instalar dependências:**
```bash
cd apps/portal
npm install --save-dev husky lint-staged
```

**`apps/portal/package.json`:**
```json
{
  "scripts": {
    "prepare": "cd ../.. && husky apps/portal/.husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

**`apps/portal/.husky/pre-commit`:**
```sh
#!/usr/bin/env sh
cd apps/portal && npx lint-staged
```

**Limitações documentadas:**
- `--no-verify` é escape hatch conhecido. Regra do projeto proíbe uso sem autorização (CLAUDE.md).
- lint-staged roda `vitest related` que só cobre arquivos afetados — é rápido (<30s).

### 6. Testcontainers em CI

**Criar `apps/portal/vitest.integration.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/integration/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./src/__tests__/integration/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
```

**Job no workflow de test:**
```yaml
integration-tests:
  if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  services:
    postgres:
      image: pgvector/pgvector:pg16
      env:
        POSTGRES_PASSWORD: test
        POSTGRES_DB: portal_test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
    minio:
      image: bitnami/minio:latest
      env:
        MINIO_ROOT_USER: testaccess
        MINIO_ROOT_PASSWORD: testsecret123
      ports:
        - 9000:9000
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: cd apps/portal && npm ci
    - name: Run migrations
      run: cd apps/portal && npm run db:migrate
      env:
        DATABASE_URL: postgres://postgres:test@localhost:5432/portal_test
    - name: Run integration tests
      run: cd apps/portal && npx vitest --config vitest.integration.config.ts --run
      env:
        DATABASE_URL: postgres://postgres:test@localhost:5432/portal_test
        MINIO_ENDPOINT: localhost
        MINIO_PORT: 9000
        MINIO_ACCESS_KEY: testaccess
        MINIO_SECRET_KEY: testsecret123
```

### 7. Stryker Workflow (semanal)

**Criar `.github/workflows/stryker.yml`:**
```yaml
name: Mutation Testing

on:
  workflow_dispatch:
  schedule:
    - cron: '0 4 * * 1'  # Segunda 4h UTC

jobs:
  mutation:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd apps/portal && npm ci
      - run: cd apps/portal && npx stryker run
        env:
          STRYKER_DASHBOARD_API_KEY: ${{ secrets.STRYKER_DASHBOARD_API_KEY }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: stryker-report
          path: apps/portal/reports/mutation/
```

### 8. Flaky Detector (semanal)

Ver `06-ai-powered-quality.md` seção 4.

### 9. Test Impact Analysis (PRs)

Ver `06-ai-powered-quality.md` seção 5.

## Ordem de Implementação

Recomendado em ordem crescente de risco:

1. **Dependabot** (risco zero, ganho imediato)
2. **Coverage + Codecov** (só observabilidade)
3. **CodeQL** (só observabilidade, não bloqueia ainda)
4. **Husky + lint-staged** (local, pode ser desabilitado)
5. **Testcontainers** (novo job, não afeta existentes)
6. **Branch Protection** (última — bloqueia merges)

## Validação por Gate

| Gate | Onde falha | Ação |
|------|-----------|------|
| TypeScript | `npm run typecheck` | Tipagem inconsistente |
| ESLint | `npm run lint` | Padrão de código |
| Vitest | `npm test` | Regressão funcional |
| Coverage | Codecov threshold | Código novo sem teste |
| Playwright | `npm run e2e` | Fluxo quebrado |
| CodeQL | Security tab | Vulnerabilidade detectada |
| Trivy | Security tab | Imagem com CVE crítico |
| Stryker | Relatório semanal | Testes fracos (mutation < 70%) |
| Flaky detector | Relatório semanal | Teste não-determinístico |

## Métricas de Sucesso

- **Tempo de CI em PR** (changed tests): < 2min
- **Tempo de CI em merge** (full suite): < 10min
- **Mutation score**: >= 70% (alvo 85%)
- **Coverage**: >= 80% (alvo 90% em utils)
- **Vulnerabilidades altas abertas**: 0
- **Testes flaky conhecidos**: 0

## Escape Hatches

Quando o pipeline é inimigo (emergências):
- `git commit --no-verify` — pula pre-commit (requer autorização)
- GitHub admin override — pode mesclar sem status checks (usar apenas em produção down)
- `skip ci` em commit message — cancela workflow (não use em main)

Todos os usos devem ser documentados em `docs/qa/override-log.md` conforme Commit Discipline.
