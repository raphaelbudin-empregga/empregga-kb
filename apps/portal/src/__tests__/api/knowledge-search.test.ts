/**
 * REGRESSION TEST - Knowledge Search API
 *
 * Bug encontrado: GET /api/knowledge/search?q=X retorna resposta inconsistente
 * Data: 2026-04-14
 * Ocasião: Implementação de smoke tests
 * Comportamento: Retorna HttpResponse.json(array) mas resultado real pode variar
 *
 * PETRIFICADOS: Qualquer mudança requer aprovação explícita.
 */

import { describe, it, expect } from 'vitest';

describe('Knowledge Search API - Regressão', () => {
  /**
   * BUG DOCUMENTADO: /api/knowledge/search retorna formato inconsistente
   *
   * No mock (handlers.ts), retorna array diretamente
   * No código real (search/route.ts:38), também retorna array
   *
   * Teste verifica se resposta é sempre array
   */
  it('GET /api/knowledge/search?q=teste deve retornar array de resultados', async () => {
    const response = await fetch('/api/knowledge/search?q=teste');
    expect(response.status).toBe(200);

    const json = await response.json();

    // Documentando comportamento esperado:
    // Resposta deve ser um array (não { success, data })
    // Cada elemento deve ter: id, title, similarity
    expect(Array.isArray(json)).toBe(true);
  });

  /**
   * Teste com query vazia
   * Deve retornar erro 400
   */
  it('GET /api/knowledge/search sem ?q deve retornar 400', async () => {
    const response = await fetch('/api/knowledge/search');
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toHaveProperty('error');
  });

  /**
   * Teste com resultado vazio
   * Deve retornar array vazio, não erro
   */
  it('GET /api/knowledge/search?q=NONEXISTENT deve retornar array vazio', async () => {
    const response = await fetch('/api/knowledge/search?q=NONEXISTENT_QUERY_xyz');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    // Array vazio é aceitável
  });

  /**
   * Estrutura de resultado
   * Cada resultado deve ter similarity score
   */
  it('resultados devem ter estrutura {id, title, similarity, ...}', async () => {
    const response = await fetch('/api/knowledge/search?q=teste');
    const json = await response.json();

    if (json.length > 0) {
      const result = json[0];
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('similarity');
      expect(typeof result.similarity).toBe('number');
    }
  });
});
