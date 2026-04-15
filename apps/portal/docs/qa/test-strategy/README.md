# Test Strategy — Empregga AIOS Portal

> **Status:** Vivo (atualizado em 2026-04-15 por Opus 4.6)
> **Predecessor:** Suíte construída por Haiku (93 testes, 98.9% passando) — ver `../FINAL_TEST_VALIDATION.md` como histórico.

Este diretório consolida **tudo** sobre qualidade e testes do portal: filosofia, diagnóstico, gaps, plano, convenções e automação AI-powered. Foi criado após uma revisão profunda que revelou que a suíte anterior, embora numerosa, tinha **armadilhas estruturais** que permitiam falsos-positivos.

## Filosofia

**"Se todos os testes passam, eu tenho confiança real de que o sistema não foi quebrado."**

Essa é a regra de ouro. Uma suíte que passa mas não captura regressões é pior que não ter suíte — cria falsa sensação de segurança.

### Princípios Operacionais

1. **Testing Trophy (Kent C. Dodds)** — Static grande > Integration maior > Unit focado > E2E no topo. Ver `03-estrategia-testing-trophy.md`.
2. **Petrified Tests Rule** — Testes existentes só mudam com aprovação explícita + justificativa documentada. Ver memória `feedback_petrified_tests.md`.
3. **Error-First Protocol** — Bug encontrado? Primeiro reproduza com teste, depois corrija. Ver memória `feedback_error_first_testing.md`.
4. **Contratos determinísticos** — Nada de `expect([200, 401]).toContain(status)`. Ou é 200, ou o teste está errado.
5. **Fail loud, fail fast** — Asserções incondicionais. Nada de `if (response.status === 200) { ... }`.
6. **Fixtures como código** — Factories em `src/__tests__/utils/fixtures.ts` derivadas dos schemas Drizzle. Single source of truth.
7. **Separação local vs. CI** — Integração real (Testcontainers) apenas em CI. Local usa MSW para velocidade.

## Índice de Documentos

| # | Arquivo | Para quem |
|---|---------|-----------|
| — | [README.md](./README.md) | Todos — ponto de entrada |
| 01 | [01-diagnostico-suite-atual.md](./01-diagnostico-suite-atual.md) | Quem quer entender onde estamos |
| 02 | [02-problemas-identificados.md](./02-problemas-identificados.md) | Catálogo por severidade (file:line) |
| 03 | [03-estrategia-testing-trophy.md](./03-estrategia-testing-trophy.md) | Quem vai escrever novos testes |
| 04 | [04-gaps-de-cobertura.md](./04-gaps-de-cobertura.md) | O que não é testado mas deveria |
| 05 | [05-plano-execucao.md](./05-plano-execucao.md) | Roadmap das 5 fases |
| 06 | [06-ai-powered-quality.md](./06-ai-powered-quality.md) | LLM-as-Judge, Stryker, fast-check |
| 07 | [07-convencoes-testing.md](./07-convencoes-testing.md) | Naming, AAA, fixtures, factories |
| 08 | [08-ci-cd-hardening.md](./08-ci-cd-hardening.md) | Coverage, CodeQL, branch protection |

## Quick Reference

**Comandos locais:**
```bash
cd apps/portal
npm run typecheck              # Camada "Static" do Trophy
npm run lint                   # Camada "Static" do Trophy
npm test -- --run --coverage   # Unit + Integration (com MSW)
npm run e2e                    # E2E (Playwright)
```

**Comandos CI (alguns não rodam local):**
```bash
npx stryker run                # Mutation testing (semanal)
npm run test:integration       # Testcontainers (apenas CI)
npm run test:ai-quality        # LLM-as-Judge (apenas PR → main)
```

## Documentos de Histórico (pré-revisão)

- `../FINAL_TEST_VALIDATION.md` — Snapshot Haiku, 92/93 passando
- `../TEST_SUITE_STATUS.md` — Detalhamento do estado Haiku
- `../CI_CD_SETUP.md` — Setup inicial do pipeline

Esses arquivos **não foram apagados**: são referência histórica. As diretrizes **vivas** são as deste diretório.

## Contato

Mudanças estruturais nesta estratégia requerem:
- Nova discussão com usuário
- Atualização deste README e documentos afetados
- Registro no Change Log correspondente
