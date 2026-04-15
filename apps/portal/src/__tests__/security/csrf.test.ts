/**
 * SECURITY — CSRF
 *
 * Gap G1. Placeholder — proteção CSRF ainda não implementada para
 * POSTs admin. Quando implementada, esta suíte valida:
 * - POST sem cookie adminToken → 401
 * - POST com Origin diferente do esperado → 403
 * - Tokens de CSRF obrigatórios em formulários admin
 */

import { describe, it, expect } from 'vitest';

describe.todo('Security — CSRF em rotas admin', () => {
  it('POST /api/knowledge sem Origin válido → 403', async () => {
    expect(true).toBe(true);
  });

  it('DELETE /api/knowledge/:id sem cookie adminToken → 401', async () => {
    expect(true).toBe(true);
  });
});
