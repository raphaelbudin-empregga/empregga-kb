# 03 — Estratégia: Testing Trophy

> **Referência:** [The Testing Trophy and Testing Classifications — Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## Por que Trophy e não Pyramid?

A Pirâmide de Testes (Mike Cohn) priorizava **muitos** testes unitários, **alguns** de integração, **poucos** E2E. Era correta para sua época (2009), mas assumia custo alto de integração e E2E. Ferramentas modernas (Vitest, MSW, Playwright, Testing Library) tornaram integração **rápida e barata**.

Kent C. Dodds propõe o **Testing Trophy**:

```
            /\
           /  \         E2E  ← Pouco, lento, confiança máxima
          /────\
         / Inte \        Integration  ← MAIOR PORÇÃO — melhor ROI
        / gration\
       /──────────\
      /   Unit     \     Unit  ← Funções puras, lógica complexa
     /──────────────\
    /    Static      \   Static  ← BASE SÓLIDA — grátis, rápido
   /──────────────────\
```

**Insight central:** a camada de **integração** dá mais confiança por unidade de esforço. Unit testa implementação; integration testa comportamento do usuário através das camadas.

## Alvo para o Portal

### Camada 1 — Static (base ampla, gratuita)

- **TypeScript strict** — `tsconfig.json` já tem `strict: true` ✅
- **ESLint** — `eslint-config-next/core-web-vitals` + `typescript` ✅
- **Zod runtime validation** — validar inputs/outputs em rotas API
- **CodeQL SAST** — análise estática de segurança (a adicionar)

**Alvo:** 100% dos arquivos tipados, 0 warnings ESLint em CI.

### Camada 2 — Unit

**Quando usar:** funções puras com lógica complexa (algoritmos, cálculos, parsers, validadores).

**Exemplos no portal:**
- `calculateHealth(unit)` — regra de saúde (CRITICAL/WARNING/GREAT) ✅
- Futuros: `extractOrionFields(raw)`, `normalizeQuery(input)`, `buildEmbeddingInput(text)`

**Ferramentas:** Vitest, `vi.setSystemTime()` para determinismo, `fast-check` para property-based.

**Alvo:** cobertura >= 90% em `src/utils/`, mutation score >= 80%.

### Camada 3 — Integration (a maior, foco principal)

**Quando usar:** testar uma rota API inteira, um componente com seus hooks, um fluxo multi-step.

**Exemplos no portal:**
- `POST /api/knowledge` → validação + insert no DB + resposta
- `EvaChat` → envio → fetch → renderização da resposta
- `POST /api/chat/handoff` → validação + webhook Zammad + persistência

**Ferramentas:**
- **MSW** para mockar boundaries externos (Zammad, OpenAI)
- **Testing Library** para componentes, interagindo como usuário real
- **Testcontainers em CI** para DB/MinIO reais quando necessário

**Alvo:** 60-70% dos testes aqui. Todas rotas API cobertas. Todos fluxos de usuário críticos cobertos.

### Camada 4 — E2E

**Quando usar:** fluxos de negócio críticos onde múltiplas páginas/interações são essenciais.

**Exemplos no portal:**
- Login admin → criar knowledge → ver em lista
- Usuário anônimo → chat EVA → handoff → ticket criado
- Admin → gerenciar blind spots → soft-delete → restore

**Ferramentas:** Playwright (Chromium + Firefox), `@axe-core/playwright` para acessibilidade.

**Alvo:** 5-10 cenários cobrindo 100% dos fluxos críticos de negócio.

## Decisões Específicas

### "Testar na boundary"

Em vez de:
```typescript
// ❌ unit-mock pesado
const mockDb = { select: vi.fn().mockResolvedValue([...]) };
const result = await getKnowledge(mockDb);
```

Preferir:
```typescript
// ✅ integration com MSW mockando apenas a boundary HTTP externa
const response = await fetch('/api/knowledge');
const json = await response.json();
expect(json.data).toHaveLength(3);
```

### "Zero mocks do próprio código"

Mockar **apenas** serviços externos (OpenAI, Zammad, webhook n8n). Nunca mockar funções do próprio repo — use a implementação real.

### "Tempo é input"

Qualquer teste que dependa de `Date.now()`, `new Date()`, `setTimeout` deve usar `vi.setSystemTime()` + `vi.useFakeTimers()`. `calculateHealth.test.ts` já faz isso.

### "Aleatoriedade é input"

Testes com UUID/randomness devem mockar ou usar seed determinística. Property-based testing (`fast-check`) usa seed reprodutível.

### "Contratos explícitos"

Cada rota API tem um **contrato** (request shape + response shape). MSW handlers devem refletir o contrato exato. Divergência entre handler e rota real é um bug do teste.

## Orçamento por Camada

Para o portal, o alvo final é:

| Camada | % do Esforço | % dos Testes | Tempo de CI |
|--------|--------------|-------------|-------------|
| Static | 10% | — (gates) | < 30s |
| Unit | 20% | 15-20% | < 1min |
| Integration | 55% | 55-65% | 2-4min |
| E2E | 15% | 10-15% | 3-5min |

Total CI: **5-10 minutos** (com paralelização e cache).

## Anti-Padrões Proibidos

1. **Snapshot tests gigantes** — são commits de "aceitar como está", não testes.
2. **`expect(mock).toHaveBeenCalled()`** como única asserção — testa implementação, não comportamento.
3. **Testes que "apenas rodam"** — se o código pode quebrar e o teste passa, o teste não serve.
4. **`screen.debug()`** em commit — ferramenta de debug, não de teste.
5. **`beforeAll` mutando estado compartilhado entre describes** — cria ordem implícita.
6. **Skip/xit/it.todo em main** — CI deve falhar se houver pendência.

## Referências

- Kent C. Dodds — [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- Martin Fowler — [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) (histórico)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
