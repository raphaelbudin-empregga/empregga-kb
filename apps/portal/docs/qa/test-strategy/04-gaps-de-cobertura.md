# 04 — Gaps de Cobertura

> **Pergunta-guia:** "Se esse código quebrar em produção, algum teste falha?" Para cada gap abaixo, a resposta é NÃO.

## Mapa de Gaps

```
┌─────────────────────────────────────────────────────────┐
│ ROTAS API (14 rotas)                                    │
│  ├─ /api/analytics              [Parcial]               │
│  ├─ /api/auth/login             [Armadilhas]            │
│  ├─ /api/auth/logout            [🚫 ZERO testes]        │
│  ├─ /api/auth/setup             [🚫 ZERO testes]        │
│  ├─ /api/blindspots             [Superficial]           │
│  ├─ /api/blindspots/[id]        [Superficial]           │
│  ├─ /api/chat                   [Happy path]            │
│  ├─ /api/chat/feedback          [🚫 ZERO testes]        │
│  ├─ /api/chat/handoff           [Superficial]           │
│  ├─ /api/knowledge              [Boa base, gaps]        │
│  ├─ /api/knowledge/[id]         [Boa base]              │
│  ├─ /api/knowledge/bulk         [🚫 ZERO testes]        │
│  ├─ /api/knowledge/search       [Superficial]           │
│  └─ /api/upload                 [🚫 ZERO testes]        │
│                                                         │
│ COMPONENTES (6)                                         │
│  ├─ AnalyticsDashboard          [🚫 ZERO testes]        │
│  ├─ BlindSpotsList              [🚫 ZERO testes]        │
│  ├─ EvaChat                     [Parcial, frágil]       │
│  ├─ KnowledgeForm               [🚫 ZERO testes]        │
│  ├─ KnowledgeList               [🚫 ZERO testes]        │
│  └─ KnowledgeManager            [🚫 ZERO testes]        │
│                                                         │
│ UTILS                                                   │
│  ├─ embeddings.ts               [🚫 ZERO testes]        │
│  ├─ minio.ts                    [🚫 ZERO testes]        │
│  └─ import-orion.ts             [🚫 ZERO testes]        │
└─────────────────────────────────────────────────────────┘
```

## Gaps Críticos (priorizar primeiro)

### G1. Segurança

Nenhum teste de:
- **SQL injection** em `/api/knowledge/search?q=`, `/api/knowledge` filter
- **XSS** em respostas da EVA, em títulos de knowledge, em feedback text
- **Rate limiting** em `/api/auth/login` (força bruta)
- **CSRF** em POSTs autenticados (origem/token)
- **Path traversal** em `/api/upload` (filename malicioso)
- **Command injection** em import Orion (se houver shell-out)

**Impacto:** produção vulnerável a ataques básicos. Auditoria de segurança reprovaria.

**Plano:** nova suíte `src/__tests__/security/` com 5 arquivos.

### G2. Autorização (RLS)

Nenhum teste verifica que:
- Requisição sem `adminToken` em rota protegida → 401
- Usuário A não pode deletar recurso de B (multi-tenant futuro)
- Cookie expirado é rejeitado
- Cookie adulterado é rejeitado

**Impacto:** vazamento de dados se middleware quebrar silenciosamente.

**Plano:** `src/__tests__/rls/`.

### G3. Integração Real (DB, MinIO, OpenAI)

Toda suíte depende de MSW. Se:
- **Credenciais MinIO** expirarem
- **Versão pgvector** for incompatível com schema
- **API OpenAI** mudar formato de embedding
- **Drizzle migration** quebrar schema

o CI continua verde, mas produção quebra.

**Plano:** `src/__tests__/integration/` rodando em CI com Testcontainers/services.

### G4. Rotas API não testadas

| Rota | Por que importa |
|------|-----------------|
| `POST /api/auth/logout` | Se quebrar, admin não consegue sair da sessão |
| `POST /api/auth/setup` | Se quebrar, não conseguimos provisionar novos admins |
| `POST /api/chat/feedback` | Sinal de qualidade da EVA depende disso |
| `POST /api/knowledge/bulk` | Operação destrutiva em lote — crítica validar |
| `POST /api/upload` | Entrada de arquivos no sistema |

**Plano:** adicionar testes de contrato para cada.

### G5. Componentes não testados

`KnowledgeManager` é o componente central do painel admin (CRUD, busca, health, trash). Zero testes. Se quebrar, admin não consegue gerenciar base.

**Plano:** testes de integração de componente com MSW, simulando fluxo real.

### G6. Qualidade Semântica da EVA

Chat retorna texto gerado. Teste atual valida apenas `hasAnswer: true`. Se EVA começar a responder absurdos, alucinar fatos, ou ignorar contexto, nenhum teste pega.

**Plano:** `ai-quality/eva-judge.test.ts` com golden dataset + LLM-as-Judge.

### G7. Performance / N+1

Sem baselines. `GET /api/knowledge` com 10k unidades pode:
- Fazer N+1 queries para feedbacks agregados
- Serializar tudo na memória
- Travar por 30s

Sem teste de latência, degradação passa despercebida.

**Plano:** benchmarks com `vitest bench` em rotas críticas; thresholds em CI.

## Gaps Altos

### G8. Acessibilidade

Zero testes. Admin panel pode ter problemas de contraste, foco, ARIA labels ausentes.

**Plano:** `@axe-core/playwright` em E2E.

### G9. i18n / Português

Mensagens em português estão hardcoded nos componentes. Se uma tradução quebrar, sem teste.

**Plano:** snapshot de strings críticas (mas apenas strings, não DOM).

### G10. Regressão de Embeddings

Se modelo OpenAI mudar de `text-embedding-3-small` para nova versão, similarities mudam. Sem baseline, drift passa.

**Plano:** snapshot de embeddings de golden dataset em `src/__tests__/property/`.

### G11. Idempotência Import Orion

`importKnowledgeBase()` deve ser idempotente (rodar 2x não duplica). Sem teste.

**Plano:** `integration/orion-import.integration.test.ts`.

## Gaps Médios

### G12. Tratamento de Erros do Cliente

`EvaChat` não tem testes para: fetch falhou, timeout, JSON malformado. MSW não mocka erros.

### G13. Acessibilidade de Formulários

`KnowledgeForm` pode não ter labels associadas. Sem teste.

### G14. Cross-Browser

E2E roda em Chromium + Firefox. Não roda em WebKit (Safari) nem em mobile emulation além de viewport.

## Matriz de Priorização

| Gap | Impacto | Esforço | Prioridade |
|-----|---------|---------|------------|
| G1 Segurança | Crítico | Médio | 🔴 P0 |
| G2 RLS | Crítico | Baixo | 🔴 P0 |
| G3 Integração real | Alto | Alto | 🟠 P1 |
| G4 Rotas zero | Alto | Médio | 🟠 P1 |
| G6 EVA semântica | Alto | Médio | 🟠 P1 |
| G5 Componentes | Médio | Médio | 🟡 P2 |
| G8 A11y | Médio | Baixo | 🟡 P2 |
| G11 Idempotência | Médio | Baixo | 🟡 P2 |
| G7 Performance | Médio | Alto | 🟡 P2 |
| G12 Erros cliente | Baixo | Baixo | 🔵 P3 |
| G9 i18n | Baixo | Baixo | 🔵 P3 |
| G10 Embeddings | Baixo | Médio | 🔵 P3 |

P0-P1 são alvo das Fases 2-3. P2 entra na Fase 3-4. P3 fica como backlog documentado.
