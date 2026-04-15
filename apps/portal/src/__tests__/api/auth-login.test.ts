/**
 * API Tests — POST /api/auth/login
 *
 * Porta de entrada do painel admin. Suíte determinística via MSW:
 * - test@example.com / password123 → 200
 * - qualquer outra combinação → 401
 *
 * PETRIFICADOS: qualquer mudança requer aprovação. Correção de armadilhas
 * aprovada em 2026-04-15 (ver docs/qa/test-strategy/02-problemas-identificados.md
 * CR-01 a CR-07).
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';

describe('POST /api/auth/login', () => {
  describe('sucesso', () => {
    it('retorna 200 com { success, user } quando credenciais são válidas', async () => {
      // Arrange
      const payload = { email: 'test@example.com', password: 'password123' };

      // Act
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.user).toBeDefined();
      expect(json.user.name).toBeTruthy();
      expect(json.user.email).toBe(payload.email);
    });

    it('retorna email idêntico ao fornecido no payload', async () => {
      const email = 'test@example.com';
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.user.email).toBe(email);
    });
  });

  describe('validação de campos obrigatórios', () => {
    it('retorna 400 quando email está ausente', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBeTruthy();
    });

    it('retorna 400 quando email é string vazia', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: 'password123' }),
      });
      expect(response.status).toBe(400);
    });

    it('retorna 400 quando email é null', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: null, password: 'password123' }),
      });
      expect(response.status).toBe(400);
    });

    it('retorna 400 quando password está ausente', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(response.status).toBe(400);
    });

    it('retorna 400 quando password é string vazia', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: '' }),
      });
      expect(response.status).toBe(400);
    });

    it('retorna 400 quando password é null', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: null }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe('credenciais inválidas', () => {
    it('retorna 401 quando email não existe', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/credencial|inválid|not found/i);
    });

    it('retorna 401 quando senha está incorreta', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('retorna mensagem genérica (não revela se email existe ou não)', async () => {
      const r1 = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fake@example.com', password: 'any' }),
      });
      const j1 = await r1.json();

      const r2 = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpass' }),
      });
      const j2 = await r2.json();

      expect(r1.status).toBe(401);
      expect(r2.status).toBe(401);
      expect(j1.error).toBe(j2.error);
    });
  });

  describe('cookies de sessão', () => {
    it('seta cookie adminToken em sucesso (200)', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(response.status).toBe(200);
      const cookieHeader = response.headers.get('set-cookie');
      expect(cookieHeader).toMatch(/adminToken/i);
    });

    it('cookie tem flag HttpOnly', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(response.status).toBe(200);
      const cookieHeader = response.headers.get('set-cookie');
      expect(cookieHeader).toMatch(/HttpOnly/i);
    });

    it('cookie tem SameSite=lax (proteção CSRF)', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(response.status).toBe(200);
      const cookieHeader = response.headers.get('set-cookie');
      expect(cookieHeader).toMatch(/SameSite=lax/i);
    });

    it('cookie expira em 7 dias (Max-Age=604800)', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(response.status).toBe(200);
      const cookieHeader = response.headers.get('set-cookie');
      expect(cookieHeader).toMatch(/Max-Age=604800/i);
    });

    it('NÃO seta cookie adminToken em falha (401)', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid@example.com', password: 'wrongpassword' }),
      });

      expect(response.status).toBe(401);
      const cookieHeader = response.headers.get('set-cookie') ?? '';
      expect(cookieHeader).not.toContain('adminToken');
    });
  });

  describe('robustez e segurança', () => {
    it('rejeita payload que não é JSON válido com 400', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'não é json',
      });
      expect(response.status).toBe(400);
    });

    it('rejeita Content-Type incorreto com 400', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(response.status).toBe(400);
    });

    it('ignora campos extras e autentica normalmente', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          isAdmin: true,
          superuser: true,
        }),
      });
      expect(response.status).toBe(200);
    });

    it('propaga erro 500 do servidor sem vazar stack', async () => {
      // Arrange: MSW override de erro
      server.use(
        http.post('/api/auth/login', () =>
          HttpResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
        )
      );

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).not.toMatch(/at .+\.ts:\d+/); // sem stack trace
    });
  });
});
