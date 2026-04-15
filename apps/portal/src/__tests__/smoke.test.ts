/**
 * SMOKE TESTS - Deploy Gate
 *
 * Estes testes verificam se o sistema está de pé e responsivo.
 * Se qualquer teste falhar aqui, o deploy está bloqueado.
 *
 * PETRIFICADOS: Qualquer mudança requer aprovação explícita com justificativa.
 */

import { describe, it, expect } from 'vitest';

describe('Smoke Tests - Sistema Online', () => {
  // Teste 1: Banco de dados conectado
  it('GET /api/knowledge retorna 200 e contém estrutura esperada', async () => {
    const response = await fetch('/api/knowledge');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success');
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);

    // Valida estrutura de uma unidade
    if (json.data.length > 0) {
      const unit = json.data[0];
      expect(unit).toHaveProperty('id');
      expect(unit).toHaveProperty('title');
      expect(unit).toHaveProperty('author');
    }
  });

  // Teste 2: Blind spots acessível
  it('GET /api/blindspots retorna 200 e lista válida', async () => {
    const response = await fetch('/api/blindspots');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
  });

  // Teste 3: Analytics funciona
  it('GET /api/analytics retorna 200 com dados de saúde', async () => {
    const response = await fetch('/api/analytics');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json.data).toHaveProperty('healthStats');
  });

  // Teste 4: Chat endpoint responsivo
  it('POST /api/chat retorna resposta válida', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Olá EVA' }],
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('response');
    expect(json).toHaveProperty('hasAnswer');
  });

  // Teste 5: Handoff consegue gerar ticket
  it('POST /api/chat/handoff cria ticket com dados de usuário', async () => {
    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Preciso de ajuda' }],
        userName: 'João Silva',
        userEmail: 'joao@empresa.com',
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('ticketId');
    expect(json.ticketId).toBeTruthy();
  });

  // Teste 6: Busca semântica endpoint responsivo
  // (Teste de regressão detalhado em knowledge-search.test.ts)
  it('GET /api/knowledge/search?q=X retorna 200 com array de resultados', async () => {
    const response = await fetch('/api/knowledge/search?q=teste');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    if (json.length > 0) {
      expect(json[0]).toHaveProperty('id');
      expect(json[0]).toHaveProperty('title');
      expect(json[0]).toHaveProperty('similarity');
    }
  });
});
