# 06 — AI-Powered Quality

> **Espírito do projeto:** alavancar IA para tornar a qualidade **mais inteligente**, não apenas automatizada.

Este documento descreve 6 inovações AI-powered aprovadas para a suíte. Cada uma resolve um problema que testes tradicionais **não resolvem bem**.

## 1. LLM-as-Judge para respostas da EVA

### Problema

`POST /api/chat` retorna texto gerado por IA. Testes atuais validam apenas `hasAnswer: true`. Se a EVA:
- Alucinar fatos ("A lei X diz Y" quando não diz)
- Responder fora do tom (rude, informal demais)
- Ignorar o contexto do usuário
- Omitir informação crítica

...o teste passa. Regressões semânticas passam direto.

### Solução

**Golden dataset** curado + **Claude como juiz**.

**Arquivo:** `apps/portal/docs/qa/golden-dataset/eva-qa.jsonl`
```jsonl
{"id":"q001","question":"Como faço uma rescisão por justa causa?","expected_topics":["justa causa","art. 482","documentação","prazo"],"forbidden_content":["rescisão sem motivo é ok","pode demitir sem aviso"],"must_cite_source":true,"tone":"formal-empático"}
{"id":"q002","question":"Qual o prazo do aviso prévio?","expected_topics":["30 dias","indenizado","trabalhado","proporcional"],"forbidden_content":[],"must_cite_source":true,"tone":"formal-empático"}
```

**Teste:** `src/__tests__/ai-quality/eva-judge.test.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const judgeRubric = `
Avalie a resposta da EVA em 3 dimensões (1-5):
- Relevância: a resposta endereça a pergunta?
- Correção: os fatos mencionados são corretos?
- Tom: formal-empático apropriado para atendimento?

Retorne JSON: { relevance: 1-5, correctness: 1-5, tone: 1-5, reasoning: "..." }
`;

test.each(goldenDataset)('EVA — $id', async ({ question, expected_topics, forbidden_content }) => {
  const evaResponse = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
  }).then(r => r.json());

  // Verificação determinística (fatos proibidos)
  for (const forbidden of forbidden_content) {
    expect(evaResponse.response).not.toContain(forbidden);
  }

  // Verificação semântica (LLM-as-Judge)
  const judgment = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `${judgeRubric}\n\nPergunta: ${question}\n\nResposta EVA: ${evaResponse.response}\n\nTópicos esperados: ${expected_topics.join(', ')}`,
    }],
  });

  const scores = JSON.parse(judgment.content[0].text);
  expect(scores.relevance).toBeGreaterThanOrEqual(4);
  expect(scores.correctness).toBeGreaterThanOrEqual(4);
  expect(scores.tone).toBeGreaterThanOrEqual(4);
});
```

### Execução

- **Local:** opt-in via `RUN_AI_QUALITY=true npm test`
- **CI:** apenas em PRs para `main` (custo)
- **Custo estimado:** Haiku 4.5 ~$0.0001/julgamento × 30 casos = $0.003 por rodada

### Valor

Detecta regressões que **nenhum teste determinístico captura**: mudanças de prompt engineering, modelo upgrade que muda tom, base de conhecimento desatualizada.

---

## 2. Property-Based Testing (`fast-check`)

### Problema

Testes example-based dependem da imaginação do desenvolvedor. Edge cases sutis passam.

### Solução

`fast-check` gera **milhares de inputs aleatórios** e valida **invariantes**.

**Exemplo em `calculateHealth`:**
```typescript
import fc from 'fast-check';

test('calculateHealth retorna sempre valor válido', () => {
  fc.assert(
    fc.property(
      fc.record({
        positiveFeedbacks: fc.nat({ max: 1000 }),
        negativeFeedbacks: fc.nat({ max: 1000 }),
        updatedAt: fc.date().map(d => d.toISOString()),
        createdAt: fc.date().map(d => d.toISOString()),
      }),
      (unit) => {
        const health = calculateHealth(unit);
        return ['CRITICAL', 'WARNING', 'GREAT'].includes(health);
      }
    ),
    { numRuns: 1000 }
  );
});

test('calculateHealth é determinístico', () => {
  fc.assert(
    fc.property(fc.record({...}), (unit) => {
      return calculateHealth(unit) === calculateHealth(unit);
    })
  );
});

test('mais feedbacks negativos → nunca melhora health', () => {
  fc.assert(
    fc.property(
      fc.record({ positiveFeedbacks: fc.nat(), negativeFeedbacks: fc.nat(), ... }),
      fc.nat({ min: 1 }),
      (unit, extraNegatives) => {
        const h1 = calculateHealth(unit);
        const h2 = calculateHealth({ ...unit, negativeFeedbacks: unit.negativeFeedbacks + extraNegatives });
        // h2 pode ser igual ou pior, nunca melhor
        const rank = { GREAT: 0, WARNING: 1, CRITICAL: 2 };
        return rank[h2] >= rank[h1];
      }
    )
  );
});
```

### Aplicação no portal

- `calculateHealth` — invariantes de health
- Parsers Zod — round-trip `parse(stringify(data)) === data`
- `extractOrionFields` — input válido sempre produz output válido
- Normalização de query — idempotência

### Valor

Encontra edge cases que humanos não imaginam (inputs null, strings Unicode, números negativos). Seed reprodutível.

---

## 3. Mutation Testing (Stryker)

### Problema

Coverage alto não garante teste bom. Um teste pode exercitar uma linha sem asserção significativa.

### Solução

Stryker aplica **mutações** ao código-fonte (trocar `>` por `>=`, remover linhas, negar booleanos) e roda a suíte. Se nenhum teste falhar, a mutação **sobreviveu** — sinal de que o teste é fraco.

**Config: `apps/portal/stryker.conf.mjs`**
```javascript
export default {
  mutate: [
    'src/utils/**/*.ts',
    'src/app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
  ],
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--experimental-vm-modules'],
  thresholds: { high: 80, low: 60, break: 60 },
  reporters: ['html', 'progress', 'dashboard'],
  timeoutMS: 60000,
  concurrency: 4,
};
```

### Execução

- **Cron semanal** via `.github/workflows/stryker.yml`
- Dashboard: Stryker Dashboard (gratuito para projetos privados pequenos)
- Não em cada PR (lento, 5-15 min)

### Meta

Mutation score: **>= 70% (bom), >= 85% (excelente)**.

Valor: prova que os testes detectam mudanças reais de comportamento, não apenas exercitam linhas.

---

## 4. Flaky Test Detector

### Problema

Testes não-determinísticos (flaky) minam confiança no CI. Desenvolvedores começam a ignorar falhas ("é flaky").

### Solução

Workflow que roda a suíte **10x consecutivas** e reporta testes com resultado inconsistente.

**`.github/workflows/flaky-detector.yml`:**
```yaml
name: Flaky Test Detector
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 1'  # Segunda-feira 2h UTC

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd apps/portal && npm ci
      - name: Run suite 10 times
        run: |
          cd apps/portal
          for i in $(seq 1 10); do
            echo "Run $i"
            npm test -- --run --reporter=json > "run-$i.json" || true
          done
      - name: Analyze flakiness
        run: node scripts/analyze-flaky.mjs run-*.json > flaky-report.md
      - uses: actions/upload-artifact@v4
        with:
          name: flaky-report
          path: apps/portal/flaky-report.md
```

Script `scripts/analyze-flaky.mjs` compara JSONs e lista testes com resultado diferente entre runs.

### Valor

Permite agir proativamente em flakiness antes de virar "teste que sempre ignoramos".

---

## 5. Test Impact Analysis

### Problema

Rodar suíte completa em cada commit desperdiça CI. Feedback loop lento desencoraja commits pequenos.

### Solução

`vitest --changed` roda apenas testes afetados pelo diff vs. `origin/main`.

**`.github/workflows/test-impact.yml`:**
```yaml
name: Test Impact (PR)
on:
  pull_request:
    branches: [main]

jobs:
  test-changed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd apps/portal && npm ci
      - run: cd apps/portal && npx vitest --changed origin/main --run

  test-full:
    if: github.event.pull_request.base.ref == 'main'
    runs-on: ubuntu-latest
    needs: test-changed
    steps:
      # full suite só depois do changed passar, como safety net
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd apps/portal && npm ci && npm test -- --run
```

### Valor

- PR com mudança em 1 arquivo: CI em **30s** em vez de 5min
- Merge para main: suíte completa garante safety net

---

## 6. Snapshot Semântico de Embeddings (stretch goal)

### Problema

OpenAI pode atualizar `text-embedding-3-small` silenciosamente. Similarities mudam, resultados de busca regridem.

### Solução

Armazenar embeddings de ~20 frases canônicas em `apps/portal/docs/qa/embedding-baselines.json`. Em cada rodada, comparar:
- Similaridade cosseno entre baseline e novo embedding > 0.95
- Se < 0.95: modelo mudou, alerta

Não está na prioridade P0, mas documentado para execução futura.

---

## Resumo de Impacto

| Inovação | Detecta | Frequência | Custo |
|----------|---------|-----------|-------|
| LLM-as-Judge | Regressão semântica da EVA | PR → main | ~$0.01/PR |
| Property-based | Edge cases não imaginados | Cada commit | Grátis |
| Mutation testing | Testes fracos | Semanal | ~15min CI |
| Flaky detector | Não-determinismo | Semanal | ~10min CI |
| Test impact | Lentidão de feedback | Cada PR | Economiza tempo |
| Embedding snapshot | Drift de modelo OpenAI | Deploy | Grátis |

**Filosofia:** cada ferramenta resolve um problema específico que testes tradicionais não resolvem. Juntas, criam um sistema **inteligente** de qualidade que cresce com o projeto.
