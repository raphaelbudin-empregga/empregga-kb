/**
 * SECURITY — Rate Limiting
 *
 * Gap G1. Placeholder documentando o teste esperado em produção.
 * Rate limiting real requer Redis/memory store; em MVP ainda não
 * existe middleware. Este teste marca o requisito para quando for
 * implementado.
 */

import { describe, it, expect } from 'vitest';

describe.todo('Security — Rate Limiting em /api/auth/login', () => {
  it('100 requisições em < 1 minuto → 101ª retorna 429', async () => {
    // Implementar quando middleware de rate-limiting existir.
    // Esperado: primeiras ~20 retornam 401, a partir do limiar retorna 429
    // com header Retry-After.
    expect(true).toBe(true);
  });
});
