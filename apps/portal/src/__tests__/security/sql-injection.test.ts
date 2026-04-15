/**
 * SECURITY — SQL Injection
 *
 * Gap G1. Valida que payloads clássicos não quebram parse nem vazam
 * dados sensíveis através da API. Integração real (exercitando o DB)
 * está em integration/pgvector.integration.test.ts.
 */

import { describe, it, expect } from 'vitest';

const sqlPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE knowledge_units; --",
  "' UNION SELECT password FROM admins --",
  "1' AND SLEEP(5) --",
  "admin'--",
  "\\'; DROP TABLE users;--",
];

describe('Security — SQL Injection', () => {
  describe('GET /api/knowledge/search', () => {
    it.each(sqlPayloads)('retorna 200 sem vazar dados sensíveis: %s', async (payload) => {
      const response = await fetch(
        `/api/knowledge/search?q=${encodeURIComponent(payload)}`
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json)).toBe(true);

      // Invariante: resposta não deve conter valores de campos sensíveis
      // (o payload pode conter a palavra "password", mas a resposta não
      // deve ter o CAMPO password nem um hash bcrypt).
      for (const item of json) {
        expect(item).not.toHaveProperty('password');
        expect(item).not.toHaveProperty('passwordHash');
        expect(item).not.toHaveProperty('adminToken');
        const serialized = JSON.stringify(item);
        expect(serialized).not.toMatch(/\$2[aby]\$\d{2}\$/); // bcrypt hash
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it.each(sqlPayloads)('retorna 401 (nunca autentica) com email injetado: %s', async (payload) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload, password: 'password123' }),
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      const cookie = response.headers.get('set-cookie') ?? '';
      expect(cookie).not.toContain('adminToken=');
    });

    it.each(sqlPayloads)('retorna 401 com password injetada: %s', async (payload) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: payload }),
      });

      expect(response.status).toBe(401);
    });
  });
});
