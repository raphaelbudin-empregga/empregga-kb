/**
 * RLS / Autorização — Rotas Protegidas
 *
 * Gap G2. Toda rota admin deve exigir cookie adminToken. Sem cookie: 401.
 *
 * NOTA: como MSW não implementa verificação de cookie por padrão, este
 * teste documenta o contrato esperado. Execução real contra servidor
 * Next.js está em integration/protected-routes.integration.test.ts.
 */

import { describe, it, expect } from 'vitest';

const protectedRoutes: Array<{ method: string; path: string; body?: unknown }> = [
  { method: 'POST', path: '/api/knowledge', body: { title: 't', category: [], problemDescription: 'p', officialResolution: 'r', author: 'a' } },
  { method: 'PUT', path: '/api/knowledge/test-1', body: { title: 'novo' } },
  { method: 'DELETE', path: '/api/knowledge/test-1' },
  { method: 'POST', path: '/api/knowledge/bulk', body: { units: [] } },
  { method: 'DELETE', path: '/api/blindspots/blind-1' },
  { method: 'POST', path: '/api/upload' },
];

describe.todo('RLS — Rotas Protegidas (sem adminToken → 401)', () => {
  it.each(protectedRoutes)('$method $path retorna 401 sem cookie', async ({ method, path, body }) => {
    // Pendente: MSW não simula o middleware de auth. Implementar quando
    // tivermos integration tests contra servidor real (Testcontainers).
    const response = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    expect(response.status).toBe(401);
  });
});
