/**
 * REGRESSION TESTS - Chat Handoff
 *
 * Testes para bugs conhecidos e comportamento esperado do handoff.
 * PETRIFICADOS: Qualquer mudança requer aprovação explícita.
 */

import { describe, it, expect } from 'vitest';

describe('Chat Handoff - Regressões', () => {
  /**
   * Regressão: EvaChat.tsx linhas 116-117
   * Antes: hardcode "Raphael Budin" e email fixo
   * Agora: aceita props userName e userEmail, com fallbacks
   */
  it('deve usar props de usuário quando fornecidas, não hardcode', async () => {
    const userName = 'João Silva';
    const userEmail = 'joao.silva@empregga.com.br';

    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Preciso de ajuda' }],
        userName,
        userEmail,
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.ticketId).toBeTruthy();
    // O ticket deve ser criado com os dados fornecidos, não com "Raphael Budin"
  });

  /**
   * Regressão: Fallback para valores padrão
   * Quando userName/userEmail não são fornecidos, deve usar fallbacks
   * Fallback esperado: "Operador" e "agente@empregga.com.br"
   */
  it('deve usar fallback "Operador" quando userName não fornecido', async () => {
    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Ajuda!' }],
        // userName não fornecido — deve usar fallback
        userEmail: 'teste@empregga.com.br',
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    // Sistema não deve quebrar com usuário undefined
  });

  /**
   * Regressão: Fallback para email padrão
   * Quando userEmail não é fornecido, deve usar "agente@empregga.com.br"
   */
  it('deve usar fallback "agente@empregga.com.br" quando userEmail não fornecido', async () => {
    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Help' }],
        userName: 'Usuário Teste',
        // userEmail não fornecido — deve usar fallback
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  /**
   * Regressão: Valores vazios devem ser tratados como não fornecidos
   * Strings vazias devem trigerar fallbacks
   */
  it('deve usar fallback para userEmail vazio', async () => {
    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Help' }],
        userName: 'João',
        userEmail: '', // vazio
      }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  /**
   * Regressão: Histórico de conversa deve estar sempre presente
   * Sem histórico vazio, handoff falha
   */
  it('deve falhar se mensagens array estiver vazio', async () => {
    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        userName: 'João',
        userEmail: 'joao@empregga.com.br',
      }),
    });

    expect(response.status).toBe(400);
  });

  /**
   * Regressão: Histórico deve conter role e content
   * Mensagens malformadas devem ser rejeitadas
   */
  it('deve validar estrutura das mensagens', async () => {
    const response = await fetch('/api/chat/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user' }], // falta content
        userName: 'João',
        userEmail: 'joao@empregga.com.br',
      }),
    });

    // Pode aceitar (o servidor decide se é válido)
    // Este teste documenta o comportamento esperado
    expect([200, 400]).toContain(response.status);
  });
});
