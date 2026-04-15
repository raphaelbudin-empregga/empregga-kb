# 05 — Plano de Execução

> **Status:** Aprovado pelo usuário em 2026-04-15.
> **Método:** 5 fases, validação incremental, commits estruturados por fase.

## Fase 0 — Documentação (ATUAL)

**Objetivo:** Registrar raciocínio completo antes de qualquer mudança de código.

**Entregáveis:**
- [x] `README.md` — índice e filosofia
- [x] `01-diagnostico-suite-atual.md`
- [x] `02-problemas-identificados.md`
- [x] `03-estrategia-testing-trophy.md`
- [x] `04-gaps-de-cobertura.md`
- [x] `05-plano-execucao.md` (este arquivo)
- [ ] `06-ai-powered-quality.md`
- [ ] `07-convencoes-testing.md`
- [ ] `08-ci-cd-hardening.md`
- [ ] Atualizar `MEMORY.md` com pointer

**Validação:** revisão humana do conteúdo.

**Commit:** `docs(qa): establish test strategy with Testing Trophy methodology`

---

## Fase 1 — Correção de Armadilhas (aprovado em bloco)

**Objetivo:** Eliminar falsos-positivos da suíte existente.

### 1.1 `auth-login.test.ts` (7 armadilhas)

**Abordagem:**
1. Criar fixture determinística no MSW: user `test@example.com` / `password123` sempre retorna 200 com user object previsível.
2. Para cada teste de validação (400), garantir que MSW retorna 400 determinístico.
3. Substituir cada `expect([X, Y]).toContain(status)` por `expect(status).toBe(X)`.
4. Remover cada `if (status === 200) { ... }` — asserções viram incondicionais.

### 1.2 `smoke.test.ts:96`

Substituir `expect(json).toBeTruthy()` por validação estrutural de `results` array.

### 1.3 `knowledge.test.ts` (3 asserções faltantes)

- Linha 41: `expect(json.data.deletedAt).toBeNull()` após restore.
- Linha 66: GET após PUT para validar título atualizado.
- Linha 80: `expect(json.data.every(u => u.deletedAt !== null)).toBe(true)`.

### 1.4 `EvaChat.test.tsx`

- Linha 116-119: `waitFor` com `expect` dentro.
- Linhas 80-82: usar `getByRole`/`getByLabelText` com `data-testid` quando necessário; remover fallback `querySelector`.

### 1.5 `handlers.ts`

Exportar factories de handlers:
- `handlersHappy` (default)
- `handlersError500`
- `handlersTimeout`
- `handlersValidation400`

Permitir `server.use(...handlersError500)` em testes que validam tratamento de erro.

### 1.6 `vitest.config.ts`

Adicionar thresholds de coverage:
```typescript
coverage: {
  thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
  reporter: ['text', 'json', 'html', 'lcov'],
}
```

### 1.7 `playwright.config.ts`

Healthcheck customizado antes dos testes; timeout 180s.

**Validação Fase 1:**
```bash
npm run typecheck && npm run lint && npm test -- --run --coverage
```
- Todos testes passando
- Coverage >= 80%
- `grep -r "toContain(\[200" src/__tests__/` retorna vazio
- `grep -r "if (response.status" src/__tests__/` retorna apenas ocorrências justificadas

**Commit:** `test(portal): fix 15 structural traps in existing test suite`

---

## Fase 2 — Security, RLS, Integração Real

**Objetivo:** Preencher gaps críticos (G1, G2, G3 de `04-gaps-de-cobertura.md`).

### 2.1 Security Suite

`src/__tests__/security/`:
- `sql-injection.test.ts` — payloads clássicos (`'; DROP TABLE`, `' OR 1=1 --`) em todos query params
- `xss.test.ts` — `<script>alert(1)</script>` em POSTs de knowledge/feedback/handoff
- `rate-limiting.test.ts` — 100 requests seguidos em `/api/auth/login` → 429 esperado
- `csrf.test.ts` — POST sem Origin/Referer → 403
- `path-traversal.test.ts` — `../../etc/passwd` como filename

### 2.2 RLS Suite

`src/__tests__/rls/`:
- `protected-routes.test.ts` — 12 rotas admin sem cookie → 401
- `knowledge-authorization.test.ts` — placeholder para multi-tenant futuro

### 2.3 Integration Suite (CI-only)

`src/__tests__/integration/`:
- `minio.integration.test.ts` — upload → retrieve → delete
- `pgvector.integration.test.ts` — insert embedding → search → validar ordem
- `orion-import.integration.test.ts` — rodar 2x → count não dobra

**Configuração:**
- Rodam com `vitest --config vitest.integration.config.ts`
- Config custom detecta `process.env.CI === 'true'`; pula localmente
- GitHub Actions services: `postgres:16` + `pgvector/pgvector:pg16` + `minio/minio`

### 2.4 Fixtures

`src/__tests__/utils/fixtures.ts`:
```typescript
export const makeKnowledgeUnit = (overrides?): KnowledgeUnit => ({ ... });
export const makeBlindSpot = (overrides?): BlindSpot => ({ ... });
export const makeAnalyticsEvent = (overrides?): AnalyticsEvent => ({ ... });
```

Derivar tipos de schemas Drizzle.

**Validação Fase 2:**
- Testes de security rodam e passam (ou documentam vulnerabilidade real)
- Testes de RLS rodam e passam
- Testes de integration rodam **apenas** em CI, verde

**Commit:** `test(portal): add security, RLS, and integration test suites`

---

## Fase 3 — E2E Robusto + AI-Powered Quality

**Objetivo:** E2E de fluxos completos + inovações que detectam regressões sutis.

### 3.1 E2E Full-Flow

`src/e2e/full-flow.spec.ts`:
1. Admin faz login → dashboard aparece
2. Cria nova knowledge unit → aparece na lista
3. Faz busca semântica → resultado inclui a unit criada
4. Abre chat (página pública) → pergunta → EVA responde com source
5. Clica handoff → ticket criado
6. Admin volta → vê blindspot gerado

`src/e2e/accessibility.spec.ts`:
- aXe-core em `/`, `/chat`, `/login`, `/admin/knowledge`
- 0 violações `critical` ou `serious`

### 3.2 LLM-as-Judge (EVA Quality)

`src/__tests__/ai-quality/eva-judge.test.ts`:
- Golden dataset: `docs/qa/golden-dataset/eva-qa.jsonl` (~30 pares)
- Cada linha: `{ question, expectedTopics, forbiddenContent, mustCite }`
- Juiz: Claude Haiku 4.5 via Anthropic SDK
- Rubrica: relevância (1-5), correção (1-5), tom (1-5)
- Threshold: média >= 4.0 por categoria
- Roda apenas com env `RUN_AI_QUALITY=true` (PR → main)

### 3.3 Property-Based

`src/__tests__/property/calculateHealth.prop.test.ts`:
```typescript
fc.assert(fc.property(
  fc.record({ /* shape de KnowledgeUnit */ }),
  (unit) => {
    const health = calculateHealth(unit);
    return ['CRITICAL', 'WARNING', 'GREAT'].includes(health);
  }
), { numRuns: 1000 });
```

Mais invariantes: idempotência, monotonicidade, ordenação.

### 3.4 Stryker Mutation Testing

`stryker.conf.mjs`:
- `mutate: ['src/utils/**/*.ts', 'src/app/api/**/*.ts']`
- `testRunner: 'vitest'`
- Threshold: high 80, low 60, break 60

Rodado em cron semanal (`.github/workflows/stryker.yml`), não em cada PR.

### 3.5 Flaky Test Detector

`.github/workflows/flaky-detector.yml`:
- Trigger: `workflow_dispatch`
- Roda `npm test -- --run` 10x
- Compara resultados; reporta testes não-determinísticos

### 3.6 Test Impact Analysis

`.github/workflows/test-impact.yml`:
- Em PRs: `vitest --changed` (apenas testes afetados pelo diff)
- Em merge para main: suíte completa

**Validação Fase 3:**
```bash
npm run e2e                    # Full flow passa
RUN_AI_QUALITY=true npm test   # LLM judge >= 4.0
npx stryker run                # Mutation >= 70%
```

**Commit:** `test(portal): add AI-powered quality (LLM judge, mutation, property-based)`

---

## Fase 4 — CI/CD Hardening

**Objetivo:** Pipeline à prova de erros com gates automáticos.

### 4.1 Workflow Security

`.github/workflows/security.yml`:
```yaml
- CodeQL: javascript-typescript
- Dependabot: npm + github-actions, semanal
- Trivy: container scan (Docker image)
```

### 4.2 Dependabot

`.github/dependabot.yml`:
- npm: weekly
- github-actions: weekly
- docker: weekly

### 4.3 Codecov

Atualizar `apps/portal/.github/workflows/test.yml`:
- Upload LCOV para Codecov após `npm test`
- PR comment com delta de coverage
- Gate: falha se coverage cair > 2%

### 4.4 Branch Protection (documentação)

Em `08-ci-cd-hardening.md` — passos manuais para admin GitHub ativar:
- Require PR review (1 approver)
- Require status checks: `test`, `lint`, `typecheck`, `e2e:smoke`, `CodeQL`
- Require branches up to date
- No force push, no deletion

### 4.5 Husky + lint-staged

`apps/portal/.husky/pre-commit`:
```sh
cd apps/portal && npx lint-staged
```

`apps/portal/.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": ["eslint --fix", "vitest related --run"]
}
```

`apps/portal/package.json` — adicionar:
- `"prepare": "cd .. && husky apps/portal/.husky"`
- devDeps: `husky`, `lint-staged`, `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `fast-check`, `@axe-core/playwright`

**Validação Fase 4:**
- Push para branch: workflows CodeQL + Dependabot ativos
- Coverage visível em PR
- `git commit` sem `--no-verify` roda lint-staged
- Documentação `08-ci-cd-hardening.md` completa

**Commit:** `ci: harden pipeline with CodeQL, Codecov, Dependabot, Husky`

---

## Fase 5 — Validação Final

**Objetivo:** Validar que a soma das fases entrega confiança real.

### 5.1 Validação Completa

```bash
cd apps/portal
npm run typecheck
npm run lint
npm test -- --run --coverage
npm run e2e
npx stryker run
```

Critérios:
- [ ] Zero armadilhas (grep)
- [ ] Coverage >= 80% (lines, functions, statements), >= 75% branches
- [ ] Mutation score >= 70%
- [ ] LLM-judge: 100% casos >= 4.0
- [ ] E2E verde em Chromium + Firefox
- [ ] 0 vulnerabilidades altas em CodeQL/Dependabot

### 5.2 Sanidade "trivial bug detection"

Teste manual:
1. Quebrar intencionalmente uma lógica (ex: mudar `resolutionRate` para retornar sempre 100)
2. Rodar `npm test`
3. **Esperado:** pelo menos 3 testes falham

Se nenhum teste falhar, a suíte ainda é teatral.

### 5.3 Documentação Final

- Atualizar `README.md` deste diretório com status "Fase 5 concluída"
- Criar `apps/portal/docs/qa/test-strategy/STATUS-{data}.md` com resultados
- Atualizar `MEMORY.md` com insights finais

**Commit:** `chore(qa): validate full test strategy rollout`

---

## Cronograma Sugerido

| Fase | Duração estimada | Pode parar entre fases? |
|------|------------------|-------------------------|
| 0 | 1 sessão | Sim (entrega independente) |
| 1 | 1-2 sessões | Sim |
| 2 | 2-3 sessões | Sim |
| 3 | 2-3 sessões | Sim |
| 4 | 1 sessão | Sim |
| 5 | 1 sessão | Final |

Cada fase termina com commit e validação. Usuário pode pausar a qualquer momento.
