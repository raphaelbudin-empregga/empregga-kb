# 07 — Convenções de Testing

> **Propósito:** padrões obrigatórios para todo novo teste no portal. Revisão de PR rejeita testes que violam essas convenções.

## Estrutura de Arquivos

```
apps/portal/src/__tests__/
├── api/                       # Rotas HTTP (integration)
│   └── {rota}.test.ts
├── components/                # Componentes React (integration)
│   └── {Componente}.test.tsx
├── utils/                     # Funções puras (unit)
│   └── {arquivo}.test.ts
├── security/                  # Segurança (SQL inj, XSS, etc)
│   └── {vetor}.test.ts
├── rls/                       # Autorização
│   └── {aspecto}.test.ts
├── integration/               # Integração real (CI-only)
│   └── {serviço}.integration.test.ts
├── ai-quality/                # LLM-as-Judge
│   └── {alvo}.test.ts
├── property/                  # Property-based
│   └── {alvo}.prop.test.ts
├── __mocks__/
│   ├── handlers.ts            # MSW handlers
│   └── server.ts
├── utils/
│   └── fixtures.ts            # Factories
└── setup.ts                   # Setup global
```

**E2E (Playwright):** `apps/portal/src/e2e/{fluxo}.spec.ts`

## Naming de Testes

### Arquivo

- `{alvo}.test.ts` para unit/integration
- `{alvo}.prop.test.ts` para property-based
- `{alvo}.integration.test.ts` para integração real
- `{fluxo}.spec.ts` para E2E Playwright

### Describe

Nome do **sujeito** testado, não do arquivo:
```typescript
// ✅ BOM
describe('POST /api/knowledge', () => { ... });
describe('calculateHealth', () => { ... });
describe('EvaChat component', () => { ... });

// ❌ RUIM
describe('knowledge.test.ts', () => { ... });
describe('Testing knowledge API', () => { ... });
```

### It / Test

Comportamento observável, não implementação:
```typescript
// ✅ BOM — descreve comportamento
it('retorna 201 com o id do novo recurso quando payload é válido', ...);
it('soft-deleta a unidade definindo deletedAt para a data atual', ...);
it('rejeita emails sem @ com status 400', ...);

// ❌ RUIM — descreve implementação
it('chama db.insert uma vez', ...);
it('testa a função createKnowledge', ...);
it('deve funcionar', ...);
```

**Idioma:** **português** (alinhado ao resto do projeto). Termos técnicos (HTTP, status, cookie) permanecem em inglês.

## Padrão AAA (Arrange-Act-Assert)

Toda função de teste organizada em 3 blocos, separados por linha em branco:

```typescript
it('retorna o título atualizado após PUT com dados válidos', async () => {
  // Arrange
  const existing = makeKnowledgeUnit({ id: 'test-1', title: 'Antigo' });
  server.use(
    http.put('/api/knowledge/test-1', () => HttpResponse.json({ success: true, data: { ...existing, title: 'Novo' } }))
  );

  // Act
  const response = await fetch('/api/knowledge/test-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Novo' }),
  });
  const json = await response.json();

  // Assert
  expect(response.status).toBe(200);
  expect(json.data.title).toBe('Novo');
});
```

## Asserções — Regras Duras

### ✅ OBRIGATÓRIO

1. **Toda função `it` tem pelo menos um `expect`.**
2. **Asserções são incondicionais.** Nada de `if (status === 200) { expect(...) }`.
3. **Asserções são determinísticas.** `expect(x).toBe(y)`, não `expect([y, z]).toContain(x)`.
4. **`waitFor` sempre contém `expect` no callback.**

### ❌ PROIBIDO

```typescript
// ❌ Armadilha CR-01
expect([200, 401]).toContain(response.status);

// ❌ Armadilha CR-04
if (response.status === 200) {
  expect(json.user).toBeDefined();
}

// ❌ Armadilha CR-08
expect(json).toBeTruthy();

// ❌ Armadilha AL-04
await waitFor(() => { /* vazio */ });

// ❌ Teste sem asserção
it('deve renderizar sem quebrar', () => {
  render(<Component />);
});
// (ao menos `expect(screen.getByRole(...)).toBeVisible()`)
```

## MSW (Mock Service Worker)

### Handlers Padrão

`src/__tests__/__mocks__/handlers.ts` exporta factories:
```typescript
export const handlersHappy: HttpHandler[] = [ ... ];
export const handlersError500: HttpHandler[] = [ ... ];
export const handlersTimeout: HttpHandler[] = [ ... ];
```

### Override Local

Use `server.use(...)` dentro do teste para override pontual:
```typescript
it('exibe erro quando servidor retorna 500', async () => {
  server.use(
    http.get('/api/knowledge', () => HttpResponse.json({ error: 'DB down' }, { status: 500 }))
  );

  // ... act e assert
});
```

### Ordem de Handlers

Rotas mais específicas **primeiro**. MSW usa primeiro match:
```typescript
// ✅
http.get('/api/knowledge/search', ...),  // específico
http.get('/api/knowledge/:id', ...),      // menos específico
http.get('/api/knowledge', ...),          // genérico
```

## Fixtures / Factories

### Regra

Nenhum teste cria objetos inline completos. Use factories de `src/__tests__/utils/fixtures.ts`:

```typescript
// ✅
const unit = makeKnowledgeUnit({ title: 'Específico deste teste' });

// ❌
const unit = {
  id: 'abc-123',
  title: 'Específico',
  category: ['PLATAFORMA'],
  problemDescription: '...',
  officialResolution: '...',
  author: 'Tester',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  status: 'PUBLISHED',
  positiveFeedbacks: 0,
  negativeFeedbacks: 0,
};
```

### Factories derivam de schemas Drizzle

Factory e schema compartilham types. Se schema muda, factory quebra em compile-time.

## Testes de Componentes

### Usar Roles, não seletores frágeis

```typescript
// ✅ BOM
screen.getByRole('button', { name: /enviar/i });
screen.getByLabelText('Email');
screen.getByText(/olá/i);  // tolerante a case

// ❌ RUIM
container.querySelector('.btn-submit');
screen.getByTestId('submit-btn');  // só se nenhum role serve
```

### `data-testid` apenas em último caso

Se um elemento não tem role semântico natural e re-estruturar o DOM é caro, `data-testid` é aceitável — mas é **code smell**, sinalize em PR.

### Ações do usuário com `userEvent`

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.type(screen.getByRole('textbox'), 'texto');
await user.click(screen.getByRole('button', { name: /enviar/i }));
```

Não use `fireEvent` — simula evento sem os efeitos colaterais que `userEvent` simula (focus, type character-by-character).

## Tempo

### Sempre determinístico

```typescript
// setup.ts
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-04-15T12:00:00Z'));
```

### Avançar tempo explicitamente

```typescript
await vi.advanceTimersByTimeAsync(1000);  // +1 segundo
```

Nunca `setTimeout(..., 100)` para "esperar".

## E2E (Playwright)

### Seletores

Mesma regra: `getByRole` > `getByLabel` > `getByText` > `getByTestId`.

### Esperas

Use auto-wait do Playwright:
```typescript
await expect(page.getByRole('heading')).toBeVisible();  // espera até 5s default
```

Nunca `page.waitForTimeout(n)` — teste flaky.

### Isolação

Cada teste começa do zero (cookies, storage limpos). Playwright faz isso automaticamente.

## Cobertura Mínima por Novo Código

- **Nova rota API:** ao menos 1 teste de happy path + 1 de validação + 1 de erro
- **Novo componente:** ao menos 1 teste de renderização + 1 de interação principal
- **Nova util:** 100% coverage, incluindo edge cases
- **Nova rota com auth:** ao menos 1 teste RLS (sem cookie → 401)

## Checklist de PR

Revisor de PR verifica:
- [ ] Arquivo no diretório correto (api/components/utils/security/rls/integration/ai-quality/property)
- [ ] Nome descritivo em português
- [ ] AAA respeitado
- [ ] Sem armadilhas (toContain array de status, if status)
- [ ] Factories usadas para objetos compostos
- [ ] MSW handlers específicos, não genéricos
- [ ] Roles semânticos, não CSS selectors
- [ ] Sem `waitForTimeout` hardcoded
- [ ] Cada `it` tem asserção significativa
