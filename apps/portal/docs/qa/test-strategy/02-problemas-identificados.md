# 02 — Problemas Identificados

> **Propósito:** catálogo completo de problemas na suíte atual, com `file:line`, severidade, justificativa da correção e proposta. Este documento é o **audit trail** exigido pela Petrified Tests Rule para aprovar modificações.

## Legenda de Severidade

| Símbolo | Nível | Critério |
|---------|-------|----------|
| 🔴 | CRÍTICO | Permite falha silenciosa de produção passar no CI |
| 🟠 | ALTO | Reduz significativamente confiança na suíte |
| 🟡 | MÉDIO | Qualidade subótima, mas detectável |
| 🔵 | BAIXO | Melhoria de manutenibilidade |

---

## 🔴 CRÍTICOS — Armadilhas Estruturais

### CR-01 | `auth-login.test.ts:31` — `toContain([200, 401])`

**Código atual:**
```typescript
expect([200, 401]).toContain(response.status);
```

**Problema:** Se o endpoint retornar 500 (bug), este teste **passa silenciosamente** porque o status não está em `[200, 401]`, o que faz `toContain` falhar... mas na verdade aceita QUALQUER status que seja 200 OU 401. O intuito era permitir dois resultados esperados, mas a consequência é que se o user fixture não existe no mock, o teste 401 passa e ninguém descobre.

**Proposta:**
```typescript
// Setup determinístico: MSW garante user conhecido
// Teste afirma o resultado esperado, não "um dos possíveis"
expect(response.status).toBe(200);
```

**Justificativa:** Um teste que passa com múltiplos resultados possíveis não testa nada. A fonte do problema é o setup não-determinístico — corrigindo o setup, a asserção vira absoluta.

---

### CR-02 a CR-07 | `auth-login.test.ts:167, 215, 235, 294, 302, 456`

**Padrões repetidos:**
- `expect([400, 401]).toContain(status)` — mesma armadilha de CR-01
- `if (response.status === 200) { ...assertions... }` — se `status !== 200`, as asserções internas são silenciadas

**Proposta unificada:** Reescrever o setup para garantir estado determinístico via MSW handlers com fixtures conhecidas, e remover todas as condicionais. Cada teste afirma exatamente um resultado.

**Exemplo (CR-04, linha 235):**
```typescript
// ANTES — asserções podem nunca rodar
if (response.status === 200) {
  const json = await response.json();
  expect(json.user.email).toBe(testEmail);
}

// DEPOIS — determinístico
expect(response.status).toBe(200);
const json = await response.json();
expect(json.user.email).toBe(testEmail);
```

---

### CR-08 | `smoke.test.ts:96` — `expect(json).toBeTruthy()`

**Código atual:**
```typescript
const json = await response.json();
expect(json).toBeTruthy();
```

**Problema:** Qualquer JSON não-nulo passa (até `{}`). Se o endpoint começar a retornar `{}` em vez de `{ results: [...] }`, o frontend quebra mas o teste passa.

**Proposta:**
```typescript
const json = await response.json();
expect(json).toHaveProperty('results');
expect(Array.isArray(json.results)).toBe(true);
```

---

### CR-09 | Global — Zero testes de RLS/Autorização

**Problema:** `DELETE /api/knowledge/:id` pode ser chamado sem cookie de autenticação. Se o middleware de proteção quebrar, qualquer anônimo pode deletar a base de conhecimento.

**Proposta:** Nova suíte `src/__tests__/rls/` com testes:
- Request sem cookie → 401
- Request com cookie de user A tentando deletar recurso de user B → 403 (quando multi-tenant for implementado)

---

### CR-10 | Global — Zero testes reais de MinIO/pgvector

**Problema:** `upload/route.ts` depende de MinIO. `knowledge/search/route.ts` depende de pgvector. MSW mocka tudo, então se a integração real quebrar (credenciais, rede, versão), o CI não detecta.

**Proposta:** Nova suíte `src/__tests__/integration/` rodando **apenas em CI** com Testcontainers (services do GitHub Actions).

---

### CR-11 | Global — Zero validação semântica da EVA

**Problema:** `POST /api/chat` retorna texto gerado por IA. Teste atual só valida `hasAnswer` existe. Se a EVA começar a devolver respostas alucinadas, o teste passa.

**Proposta:** LLM-as-Judge com golden dataset (ver `06-ai-powered-quality.md`).

---

## 🟠 ALTOS — Qualidade dos Testes

### AL-01 | `knowledge.test.ts:41` — comentário sobre asserção faltante

**Código atual:**
```typescript
expect(json.data).toHaveProperty('deletedAt');
// Idealmente deletedAt seria null aqui
```

**Problema:** Comentário descreve a asserção real mas não a implementa. Se o restore não limpar `deletedAt`, teste passa.

**Proposta:**
```typescript
expect(json.data).toHaveProperty('deletedAt');
expect(json.data.deletedAt).toBeNull();
```

---

### AL-02 | `knowledge.test.ts:66` — atualização não validada

**Código atual:** envia `{ title: 'Novo Título', ... }`, valida só `updatedAt`.

**Proposta:** Fazer GET após o PUT e validar que o título realmente mudou:
```typescript
const fresh = await fetch('/api/knowledge/test-unit-123');
const freshJson = await fresh.json();
expect(freshJson.data.title).toBe('Novo Título');
```

---

### AL-03 | `knowledge.test.ts:80` — filtro trash não validado

**Código atual:** comentário diz "todos devem ter deletedAt != null", mas não valida.

**Proposta:**
```typescript
expect(json.data.every((u: KnowledgeUnit) => u.deletedAt !== null)).toBe(true);
```

---

### AL-04 | `EvaChat.test.tsx:116-119` — `waitFor` sem asserção

**Código atual:**
```typescript
await waitFor(() => {
  // empty or loose check
});
```

**Problema:** `waitFor` com callback vazio ou sem `expect` retorna imediatamente e o teste passa.

**Proposta:**
```typescript
await waitFor(() => {
  expect(screen.getByRole('button', { name: /handoff/i })).toBeVisible();
}, { timeout: 3000 });
```

---

### AL-05 | `EvaChat.test.tsx:80-82` — fallback querySelector

**Problema:** Usa `container.querySelector(...)` como fallback de RTL. É code smell: teste frágil ao HTML interno.

**Proposta:** Usar `getByRole`, `getByLabelText`, `getByTestId` (com data-testid explícito se necessário).

---

### AL-06 | `handlers.ts` — nenhum handler de erro

**Problema:** Todos mocks retornam 200/201. Não há como testar tratamento de erro do cliente.

**Proposta:** Exportar factory de handlers com variantes:
```typescript
export const handlersError500 = [
  http.get('/api/knowledge', () => HttpResponse.json({ error: 'DB down' }, { status: 500 })),
  // ...
];
```
Usar `server.use(...handlersError500)` em testes específicos.

---

## 🟡 MÉDIOS — Infraestrutura

### ME-01 | `vitest.config.ts:13-22` — sem threshold de coverage

**Proposta:**
```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
  reporter: ['text', 'json', 'html', 'lcov'],
  // ...
}
```

---

### ME-02 | `playwright.config.ts:30-34` — webServer sem healthcheck

**Proposta:** Adicionar `stdout: 'pipe'` e healthcheck customizado; aumentar timeout para 180s.

---

### ME-03 | `analytics.test.ts:225-237` — `console.log` em testes

**Proposta:** Remover ou converter em asserção real. `console.log` não bloqueia CI e polui output.

---

### ME-04 | `setup.ts:6` — env hardcoded

**Proposta:** Mover `NEXT_PUBLIC_API_BASE` para `.env.test` carregado via `dotenv` no setup.

---

## 🔵 BAIXOS — Manutenibilidade

### BA-01 | Ausência de factories/fixtures

**Problema:** Cada teste recria objetos inline. Duplicação e drift entre testes e schema real.

**Proposta:** `src/__tests__/utils/fixtures.ts` derivando de schemas Drizzle:
```typescript
export const makeKnowledgeUnit = (overrides?: Partial<KnowledgeUnit>): KnowledgeUnit => ({
  id: crypto.randomUUID(),
  title: 'Título padrão',
  // ...defaults...
  ...overrides,
});
```

---

### BA-02 | Nenhum naming convention documentado

**Proposta:** Ver `07-convencoes-testing.md`.

---

## Resumo Numérico

| Severidade | Quantidade | Impacto |
|------------|-----------|---------|
| 🔴 CRÍTICO | 11 | Deploy pode ir para produção com bugs |
| 🟠 ALTO | 6 | Confiança na suíte reduzida |
| 🟡 MÉDIO | 4 | Qualidade subótima |
| 🔵 BAIXO | 2 | Manutenção dificultada |
| **TOTAL** | **23** | |

## Aprovação

Usuário aprovou em bloco (sessão 2026-04-15) a correção de todos os problemas listados acima, conforme Petrified Tests Rule. Correções serão aplicadas na **Fase 1** do plano de execução (`05-plano-execucao.md`).
