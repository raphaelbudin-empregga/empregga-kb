# 01 — Diagnóstico da Suíte Atual

> **Metodologia:** Leitura completa de todos os 10 arquivos de teste + configs (vitest, playwright, setup, mocks). Análise por reviewer sênior com foco em detecção de armadilhas e cobertura teatral.

## Contexto

A suíte foi construída pelo modelo **Haiku** (mais rápido, menos criterioso). Total atual: **93 testes, 98.9% passando**. Números parecem robustos, mas a análise qualitativa revela problemas estruturais graves.

## Inventário Completo

### 1. `smoke.test.ts` — 6 testes
Testa apenas status HTTP (200) dos principais endpoints. **Problema:** linha 96 `expect(json).toBeTruthy()` aceita qualquer JSON. Não valida estrutura real.

### 2. `api/auth-login.test.ts` — 24 testes
Maior suíte, com 7 sub-describes. **Sete armadilhas críticas** onde asserções são condicionais (`if (status === 200)`) ou usam `toContain` permissivo (`expect([200, 401]).toContain(...)`). Se o servidor retornar 500 consistentemente, boa parte dos testes passa silenciosamente.

### 3. `api/knowledge.test.ts` — 7 testes
CRUD + soft-delete. **Três asserções prometidas em comentários não foram implementadas** (linhas 41, 66, 80). Exemplo: comentário diz "deletedAt != null" mas teste não valida.

### 4. `api/knowledge-search.test.ts` — 4 testes
Busca semântica. Apenas valida `Array.isArray(results)`. Nenhum teste valida que embeddings pgvector realmente ordenam por similaridade. Mock hardcoda `similarity: 0.95`.

### 5. `api/analytics.test.ts` — 16 testes
Melhor estruturado depois do `calculateHealth`. Mas testa apenas aritmética do mock. Nunca valida que queries reais foram contadas. Linhas 225-237 têm `console.log` dentro de testes (não bloqueadores).

### 6. `api/chat-handoff.test.ts` — 6 testes
Valida fallbacks de userName/userEmail. **Nunca valida que ticket foi criado no sistema downstream** (Zammad). Nenhum teste de rota protegida.

### 7. `components/EvaChat.test.tsx` — 9 testes
Component tests. **Três problemas:** fallback para `querySelector` (linhas 80-82) indica fragilidade ao DOM; `waitFor` sem asserção (linha 116-119); regex `/olá.*eva.*assistente/i` quebra em texto com `<strong>`.

### 8. `utils/calculateHealth.test.ts` — 21 testes
**Único teste bem escrito.** Usa `vi.setSystemTime()` para determinismo, cobre boundary conditions (180 dias, 90 dias), casos edge (null feedbacks). Servirá de **referência de qualidade**.

### 9. `e2e/smoke.spec.ts` — 8 testes Playwright
Testes superficiais: "página carrega", "textarea está visível". Nenhum testa fluxo de negócio completo. `setContent` com iframe é frágil.

## Configurações

### `vitest.config.ts`
- ✅ jsdom environment
- ✅ globals habilitado
- ✅ setup file configurado
- ❌ **Sem threshold de coverage** — build passa com 10% de cobertura
- ⚠️ `exclude: ['src/__tests__/']` da coverage é correto, mas sem relatório visível

### `playwright.config.ts`
- ✅ Chromium + Firefox
- ✅ Traces e screenshots em falha
- ⚠️ `webServer: npm run dev` — testa modo dev, não produção
- ❌ **Sem healthcheck** antes dos testes rodarem

### `src/__tests__/setup.ts`
- ✅ `vi.setSystemTime('2026-04-15')` — determinismo
- ✅ MSW lifecycle correto (beforeAll/afterEach/afterAll)
- ✅ `scrollIntoView` mockado (necessário para jsdom)
- ⚠️ `NEXT_PUBLIC_API_BASE` hardcoded

### `src/__tests__/__mocks__/handlers.ts`
- ✅ Handlers organizados por domínio
- ✅ Ordem correta (search antes de /knowledge)
- ❌ **Todos handlers retornam 200/201** — nenhum teste de erro
- ❌ Fixtures hardcoded e invariantes (mesma proporção sempre)
- ❌ Password é comparação em clear (`===`)

## Aderência ao Testing Trophy

```
Camada           | Atual                         | Alvo (Trophy)
-----------------|-------------------------------|------------------------
Static           | TS strict + ESLint (ignorado) | Tratado como 1ª camada
Unit             | 21 testes (calculateHealth)   | ~30-40% do esforço
Integration      | 62 testes (superficiais)      | ~50-60% (base do trophy)
E2E              | 8 testes (smoke)              | ~10% (crítico, não maioria)
```

**Conclusão visual:** a pirâmide está invertida e rasa. Integration domina em número mas não em qualidade. E2E não cobre fluxos completos. Static não é contado.

## Indicadores de Confiança Real

Uma suíte merece confiança quando:
- [ ] Ao comentar uma linha de lógica de negócio, pelo menos um teste falha
- [ ] Ao mudar um comportamento (ex: HTTP 200 → 500), testes relevantes falham
- [ ] Mutation score >= 70% (Stryker)
- [ ] Coverage >= 80% com thresholds configurados
- [ ] Cada bug encontrado em produção vira teste de regressão
- [ ] CI bloqueia merge se qualquer gate falha

**Estado atual:** 0 de 6 critérios atendidos.

## Próximo

Ver `02-problemas-identificados.md` para o catálogo detalhado por severidade, com file:line e justificativa de cada correção proposta.
