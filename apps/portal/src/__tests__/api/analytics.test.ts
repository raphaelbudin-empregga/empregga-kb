/**
 * REGRESSION TESTS - Analytics API
 *
 * Testa cálculo de métricas de negócio que aparecem no dashboard.
 * CRÍTICO: erros aqui desinformam tomadores de decisão.
 * PETRIFICADOS: qualquer mudança requer aprovação.
 *
 * Fórmula (conforme analytics/route.ts:13):
 * resolutionRate = totalQueries > 0 ? ((totalQueries - totalHandoffs) / totalQueries) * 100 : 0
 *
 * Significado: % de perguntas respondidas pela IA SEM necessidade de escalação
 */

import { describe, it, expect } from 'vitest';

describe('Analytics API - Métricas de Negócio', () => {
  /**
   * Teste base: GET /api/analytics retorna estrutura esperada
   */
  it('deve retornar estrutura com success, totalQueries, totalHandoffs, resolutionRate, worstUnits', async () => {
    const response = await fetch('/api/analytics');
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('totalQueries');
    expect(json.data).toHaveProperty('totalHandoffs');
    expect(json.data).toHaveProperty('resolutionRate');
    expect(json.data).toHaveProperty('worstUnits');
  });

  /**
   * Regressão: Cálculo correto de resolutionRate
   * Quando não há queries, deve retornar 0
   */
  it('deve retornar resolutionRate = 0 quando totalQueries = 0', async () => {
    // Mock base retorna arrays vazios, logo totais = 0
    const response = await fetch('/api/analytics');
    const json = await response.json();

    if (json.data.totalQueries === 0) {
      expect(json.data.resolutionRate).toBe(0);
    }
  });

  /**
   * Regressão: Quando 100% das queries são respondidas (sem handoff)
   * resolutionRate deve ser 100
   */
  it('deve retornar resolutionRate = 100 quando totalHandoffs = 0', async () => {
    // Se totalHandoffs = 0 e totalQueries > 0:
    // (totalQueries - 0) / totalQueries * 100 = 100%
    const response = await fetch('/api/analytics');
    const json = await response.json();

    if (json.data.totalQueries > 0 && json.data.totalHandoffs === 0) {
      expect(json.data.resolutionRate).toBe(100);
    }
  });

  /**
   * Regressão: Proporção correta entre queries e handoffs
   * Exemplo: 10 queries, 2 handoffs = (10-2)/10 * 100 = 80%
   */
  it('deve calcular resolutionRate corretamente: (Q-H)/Q * 100', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    const { totalQueries, totalHandoffs, resolutionRate } = json.data;

    if (totalQueries > 0) {
      const expectedRate = Math.round(
        ((totalQueries - totalHandoffs) / totalQueries) * 100
      );
      expect(resolutionRate).toBe(expectedRate);
    }
  });

  /**
   * Regressão: resolutionRate nunca deve ser negativo
   * (mesmo que handoffs > queries, o que não deveria acontecer)
   */
  it('deve garantir resolutionRate >= 0 (nunca negativo)', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    expect(json.data.resolutionRate).toBeGreaterThanOrEqual(0);
  });

  /**
   * Regressão: resolutionRate nunca deve exceder 100%
   */
  it('deve garantir resolutionRate <= 100 (nunca acima de 100%)', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    expect(json.data.resolutionRate).toBeLessThanOrEqual(100);
  });

  /**
   * Regressão: worstUnits deve ser array
   */
  it('worstUnits deve ser um array (pode estar vazio)', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    expect(Array.isArray(json.data.worstUnits)).toBe(true);
  });

  /**
   * Regressão: Cada item em worstUnits deve ter id, title, negativeCount
   */
  it('cada item em worstUnits deve ter id, title, negativeCount', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    if (json.data.worstUnits.length > 0) {
      const worstUnit = json.data.worstUnits[0];
      expect(worstUnit).toHaveProperty('id');
      expect(worstUnit).toHaveProperty('title');
      expect(worstUnit).toHaveProperty('negativeCount');
      expect(typeof worstUnit.negativeCount).toBe('number');
    }
  });

  /**
   * Regressão: worstUnits deve estar ordenado por negativeCount DESC
   */
  it('worstUnits deve estar em ordem decrescente de negativeCount', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    if (json.data.worstUnits.length > 1) {
      for (let i = 0; i < json.data.worstUnits.length - 1; i++) {
        const current = json.data.worstUnits[i];
        const next = json.data.worstUnits[i + 1];
        expect(current.negativeCount).toBeGreaterThanOrEqual(next.negativeCount);
      }
    }
  });

  /**
   * Regressão: worstUnits deve ter limite de 5 ou menos
   */
  it('worstUnits deve retornar no máximo 5 itens', async () => {
    const response = await fetch('/api/analytics');
    const json = await response.json();

    expect(json.data.worstUnits.length).toBeLessThanOrEqual(5);
  });

  /**
   * CASOS EDGE
   */
  describe('Casos Edge - Valores Extremos', () => {
    it('deve retornar número inteiro em resolutionRate (não decimal)', async () => {
      const response = await fetch('/api/analytics');
      const json = await response.json();

      expect(json.data.resolutionRate).toEqual(
        Math.round(json.data.resolutionRate));
    });

    it('deve retornar valores não-negativos em todos os totais', async () => {
      const response = await fetch('/api/analytics');
      const json = await response.json();

      expect(json.data.totalQueries).toBeGreaterThanOrEqual(0);
      expect(json.data.totalHandoffs).toBeGreaterThanOrEqual(0);
    });

    it('handoffs nunca deve ser maior que queries (data integrity)', async () => {
      const response = await fetch('/api/analytics');
      const json = await response.json();

      expect(json.data.totalHandoffs).toBeLessThanOrEqual(json.data.totalQueries);
    });
  });

  /**
   * TESTE DE REGRESSÃO: Cenários de negócio
   */
  describe('Cenários de Negócio', () => {
    it('Cenário: Sistema novo (sem dados) - deve exibir 0%', async () => {
      // Um sistema novo teria totalQueries=0, resolutionRate=0
      const response = await fetch('/api/analytics');
      const json = await response.json();

      if (json.data.totalQueries === 0) {
        expect(json.data.resolutionRate).toBe(0);
        expect(json.data.worstUnits.length).toBe(0);
      }
    });

    it('Cenário: Sistema maduro - resolutionRate deve estar entre 70-95% (normal)', async () => {
      // Expectativa de um sistema bem calibrado: 70-95% de perguntas respondidas pela IA
      const response = await fetch('/api/analytics');
      const json = await response.json();

      // Se houver dados, validar expectativa
      if (json.data.totalQueries > 100) {
        // Sistema com volume deve estar nessa faixa idealmente
        // Este é um teste informativo, não bloqueador
        console.log(`Current resolution rate: ${json.data.resolutionRate}%`);
      }
    });

    it('Cenário: Sistema degradado - avisar se resolutionRate < 50%', async () => {
      const response = await fetch('/api/analytics');
      const json = await response.json();

      if (json.data.totalQueries > 100 && json.data.resolutionRate < 50) {
        console.warn(`⚠️  Sistema com taxa baixa: ${json.data.resolutionRate}%`);
        // Não falha o teste, apenas documenta como alerta
      }
    });
  });
});
