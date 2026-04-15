/**
 * RLS / Autorização — Knowledge Base
 *
 * Gap G2. Placeholder para modelo multi-tenant futuro. No MVP atual,
 * há um único admin; quando houver separação por organização, estes
 * testes passam a validar:
 *
 * - User da Org A não pode DELETE knowledge da Org B
 * - User da Org A não vê knowledge da Org B em listagens
 * - Cookie adulterado → 401
 * - Cookie expirado → 401 com header WWW-Authenticate
 */

import { describe, it, expect } from 'vitest';

describe.todo('RLS — Knowledge multi-tenant', () => {
  it('User A não pode deletar knowledge de Org B → 403', async () => {
    expect(true).toBe(true);
  });

  it('Listagem retorna apenas knowledge da Org do usuário', async () => {
    expect(true).toBe(true);
  });

  it('Cookie adulterado é rejeitado com 401', async () => {
    expect(true).toBe(true);
  });
});
