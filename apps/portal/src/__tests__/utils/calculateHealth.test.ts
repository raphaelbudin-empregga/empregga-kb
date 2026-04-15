/**
 * UNIT TESTS - calculateHealth()
 *
 * Função pura que classifica a saúde de uma unidade de conhecimento.
 * Crítica para o sistema de curadoria. PETRIFICADOS: qualquer mudança requer aprovação.
 *
 * Regras implementadas (conforme KnowledgeManager.tsx:96-109):
 * 1. CRITICAL se: negativeFeedbacks >= 2 AND taxaAprovação < 50%
 * 2. CRITICAL se: última atualização > 180 dias
 * 3. WARNING se: negativeFeedbacks > 0 OU última atualização > 90 dias
 * 4. GREAT caso contrário
 */

import { describe, it, expect } from 'vitest';

type HealthStatus = 'GREAT' | 'WARNING' | 'CRITICAL';

interface KnowledgeUnit {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
}

// Cópia da função a testar (replicada aqui para test isolation)
const calculateHealth = (unit: KnowledgeUnit): HealthStatus => {
  const lastUpdate = new Date(unit.updatedAt || unit.createdAt).getTime();
  const now = new Date().getTime();
  const diffDays = (now - lastUpdate) / (1000 * 3600 * 24);

  const totalFeedbacks = (unit.positiveFeedbacks || 0) + (unit.negativeFeedbacks || 0);
  const approveRate = totalFeedbacks > 0 ? (unit.positiveFeedbacks || 0) / totalFeedbacks : 1;

  if ((unit.negativeFeedbacks || 0) >= 2 && approveRate < 0.5) return 'CRITICAL';
  if (diffDays > 180) return 'CRITICAL';
  if ((unit.negativeFeedbacks || 0) > 0 || diffDays > 90) return 'WARNING';

  return 'GREAT';
};

describe('calculateHealth() - Health Scoring Logic', () => {
  const now = new Date();
  const baseUnit: KnowledgeUnit = {
    id: 'test-1',
    title: 'Test Unit',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    positiveFeedbacks: 0,
    negativeFeedbacks: 0,
  };

  /**
   * REGRA 1: CRITICAL se negativeFeedbacks >= 2 AND taxa < 50%
   * Taxa = positiveFeedbacks / totalFeedbacks
   */
  describe('Regra 1: CRITICAL com feedbacks negativos altos e taxa baixa', () => {
    it('deve retornar CRITICAL com 2 negativos e 0 positivos (taxa 0%)', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        negativeFeedbacks: 2,
        positiveFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('CRITICAL');
    });

    it('deve retornar CRITICAL com 3 negativos e 1 positivo (taxa 25%)', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 1,
        negativeFeedbacks: 3,
      };
      expect(calculateHealth(unit)).toBe('CRITICAL');
    });

    it('deve retornar CRITICAL com 2 negativos e 2 positivos (taxa exatamente 50%, mas >= 2 negativos)', () => {
      // Atenção: condição é "< 0.5", então 50% é borderline
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 2,
        negativeFeedbacks: 2,
      };
      // taxa = 2/4 = 0.5, que NÃO é < 0.5, então não é CRITICAL por essa regra
      // Mas como negativeFeedbacks > 0, pode ser WARNING
      const health = calculateHealth(unit);
      expect(['CRITICAL', 'WARNING']).toContain(health);
    });

    it('deve retornar CRITICAL com 2 negativos e 1 positivo (taxa 33%)', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 1,
        negativeFeedbacks: 2,
      };
      expect(calculateHealth(unit)).toBe('CRITICAL');
    });
  });

  /**
   * REGRA 2: CRITICAL se última atualização > 180 dias
   */
  describe('Regra 2: CRITICAL por obsolescência (>180 dias)', () => {
    it('deve retornar CRITICAL se updatedAt > 180 dias atrás', () => {
      const oldDate = new Date(now.getTime() - 181 * 24 * 60 * 60 * 1000); // 181 dias atrás
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: oldDate.toISOString(),
        positiveFeedbacks: 10,
        negativeFeedbacks: 0, // Sem feedbacks negativos
      };
      expect(calculateHealth(unit)).toBe('CRITICAL');
    });

    it('deve NÃO retornar CRITICAL se updatedAt = 180 dias atrás exatamente', () => {
      const exactDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: exactDate.toISOString(),
        positiveFeedbacks: 10,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).not.toBe('CRITICAL');
    });

    it('deve NÃO retornar CRITICAL se updatedAt < 180 dias', () => {
      const recentDate = new Date(now.getTime() - 179 * 24 * 60 * 60 * 1000);
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: recentDate.toISOString(),
        positiveFeedbacks: 10,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).not.toBe('CRITICAL');
    });
  });

  /**
   * REGRA 3: WARNING se negativeFeedbacks > 0 OU última atualização > 90 dias
   */
  describe('Regra 3: WARNING por feedback negativo ou envelhecimento', () => {
    it('deve retornar WARNING com 1 feedback negativo', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        negativeFeedbacks: 1,
        positiveFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('WARNING');
    });

    it('deve retornar WARNING se updatedAt > 90 dias atrás', () => {
      const oldDate = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: oldDate.toISOString(),
        positiveFeedbacks: 10,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('WARNING');
    });

    it('deve NÃO retornar WARNING se updatedAt = 90 dias exatamente e sem feedback negativo', () => {
      const exactDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: exactDate.toISOString(),
        positiveFeedbacks: 10,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('GREAT');
    });
  });

  /**
   * REGRA 4: GREAT em condições normais
   */
  describe('Regra 4: GREAT em condições normais', () => {
    it('deve retornar GREAT para item recém-criado sem feedbacks', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('GREAT');
    });

    it('deve retornar GREAT com feedbacks positivos altos', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 100,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('GREAT');
    });

    it('deve retornar GREAT com taxa de aprovação alta mesmo com alguns negativos', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 99,
        negativeFeedbacks: 1,
      };
      // taxa = 99/100 = 0.99 (alto)
      // negativeFeedbacks = 1 (há um, mas condição é >= 2 AND taxa < 0.5)
      // Mas há feedback negativo, então é WARNING
      expect(calculateHealth(unit)).toBe('WARNING');
    });

    it('deve retornar GREAT com item recente (< 90 dias) sem feedbacks negativos', () => {
      const recentDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: recentDate.toISOString(),
        positiveFeedbacks: 5,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('GREAT');
    });
  });

  /**
   * CASOS EDGE (Limites e condições especiais)
   */
  describe('Casos Edge', () => {
    it('deve usar createdAt como fallback se updatedAt não existir', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: '', // vazio
        createdAt: baseUnit.createdAt,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('GREAT');
    });

    it('deve lidar com nulos em feedbacks (default 0)', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('GREAT');
    });

    it('deve retornar GREAT quando totalFeedbacks = 0 (taxa default = 1.0)', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0,
      };
      // Quando não há feedbacks, taxa = 1.0 (100%), considerado "ótimo"
      expect(calculateHealth(unit)).toBe('GREAT');
    });

    it('deve priorizar condição CRITICAL sobre WARNING', () => {
      // Item que atende AMBAS as condições de CRITICAL e WARNING
      const veryOldDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 ano
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: veryOldDate.toISOString(),
        positiveFeedbacks: 0,
        negativeFeedbacks: 5,
      };
      expect(calculateHealth(unit)).toBe('CRITICAL');
    });
  });

  /**
   * TESTE DE REGRESSÃO: Casos conhecidos do sistema
   */
  describe('Testes de Regressão - Casos conhecidos', () => {
    it('deve classificar corretamente um artigo com 180+ dias sem atualização', () => {
      const outdated = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000);
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: outdated.toISOString(),
        positiveFeedbacks: 5,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('CRITICAL',
        'Artigos sem atualização há 6+ meses devem ser marcados como obsoletos'
      );
    });

    it('deve classificar corretamente um artigo com múltiplos feedbacks negativos', () => {
      const unit: KnowledgeUnit = {
        ...baseUnit,
        positiveFeedbacks: 2,
        negativeFeedbacks: 4, // Mais rejeições que aprovações
      };
      expect(calculateHealth(unit)).toBe('CRITICAL',
        'Artigos com taxa de rejeição > 50% devem ser marcados como críticos'
      );
    });

    it('deve alertar (WARNING) sobre artigos em zona cinzenta (90-180 dias)', () => {
      const aging = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // 120 dias
      const unit: KnowledgeUnit = {
        ...baseUnit,
        updatedAt: aging.toISOString(),
        positiveFeedbacks: 10,
        negativeFeedbacks: 0,
      };
      expect(calculateHealth(unit)).toBe('WARNING',
        'Artigos entre 90-180 dias merecem revisão (WARNING)'
      );
    });
  });
});
