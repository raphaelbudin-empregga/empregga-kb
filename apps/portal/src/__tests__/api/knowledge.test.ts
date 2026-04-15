/**
 * REGRESSION TESTS - Knowledge API
 *
 * Testes de CRUD da base de conhecimento.
 * PETRIFICADOS: Qualquer mudança requer aprovação explícita.
 */

import { describe, it, expect } from 'vitest';

describe('Knowledge API - Soft Delete & Restore', () => {
  /**
   * Regressão: Soft Delete
   * DELETE /api/knowledge/:id deve SETAR deletedAt, não remover do banco
   */
  it('DELETE /api/knowledge/:id deve soft-delete com deletedAt setado', async () => {
    const response = await fetch('/api/knowledge/test-unit-123', {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json.data).toHaveProperty('deletedAt');
    expect(json.data.deletedAt).not.toBeNull();
  });

  /**
   * Regressão: Restore via PUT
   * PUT /api/knowledge/:id com { restore: true } deve limpar deletedAt
   */
  it('PUT /api/knowledge/:id com restore=true deve limpar deletedAt', async () => {
    const response = await fetch('/api/knowledge/test-unit-123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('deletedAt');
    expect(json.data.deletedAt).toBeNull();
  });

  /**
   * Regressão: Edição de unidade
   * PUT /api/knowledge/:id com dados deve atualizar campos específicos
   */
  it('PUT /api/knowledge/:id deve atualizar title e description', async () => {
    const updatedData = {
      title: 'Novo Título',
      problemDescription: 'Novo problema',
      officialResolution: 'Nova solução',
      category: ['PAGAMENTO'],
    };

    const response = await fetch('/api/knowledge/test-unit-123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('updatedAt');
    expect(json.data.title).toBe(updatedData.title);
    expect(json.data.problemDescription).toBe(updatedData.problemDescription);
    expect(json.data.officialResolution).toBe(updatedData.officialResolution);
    expect(json.data.category).toEqual(updatedData.category);
  });

  /**
   * Regressão: GET com trash=true
   * GET /api/knowledge?trash=true deve retornar apenas deletados
   */
  it('GET /api/knowledge?trash=true deve retornar apenas deletados', async () => {
    const response = await fetch('/api/knowledge?trash=true');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data.every((u: { deletedAt: string | null }) => u.deletedAt !== null)).toBe(true);
  });

  /**
   * Regressão: GET sem trash retorna apenas ativos
   * GET /api/knowledge deve retornar apenas não-deletados
   */
  it('GET /api/knowledge sem trash deve retornar apenas ativos (deletedAt = null)', async () => {
    const response = await fetch('/api/knowledge?trash=false');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.every((u: { deletedAt: string | null }) => u.deletedAt === null)).toBe(true);
  });

  /**
   * Regressão: POST de nova unidade
   * POST /api/knowledge deve criar com status PUBLISHED e author preenchido
   */
  it('POST /api/knowledge deve criar unidade com campos obrigatórios', async () => {
    const newUnit = {
      title: 'Nova Unidade',
      category: ['PLATAFORMA'],
      problemDescription: 'Um problema',
      officialResolution: 'Uma solução',
      author: 'Teste Sistema',
    };

    const response = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUnit),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json.data).toHaveProperty('id');
    expect(json.data).toHaveProperty('status', 'PUBLISHED');
  });

  /**
   * Regressão: Feedback count em GET
   * GET /api/knowledge deve retornar positiveFeedbacks e negativeFeedbacks agregados
   */
  it('GET /api/knowledge deve incluir contagem de feedbacks', async () => {
    const response = await fetch('/api/knowledge');
    expect(response.status).toBe(200);

    const json = await response.json();
    if (json.data.length > 0) {
      const unit = json.data[0];
      expect(unit).toHaveProperty('positiveFeedbacks');
      expect(unit).toHaveProperty('negativeFeedbacks');
      expect(typeof unit.positiveFeedbacks).toBe('number');
      expect(typeof unit.negativeFeedbacks).toBe('number');
    }
  });
});
