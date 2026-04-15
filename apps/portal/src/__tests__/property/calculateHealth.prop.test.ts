/**
 * PROPERTY-BASED — calculateHealth
 *
 * Complementa testes example-based validando invariantes sobre
 * entradas arbitrárias (1000 runs/propriedade).
 *
 * Invariantes:
 *  I1. Retorno sempre pertence ao domínio {CRITICAL, WARNING, GREAT}
 *  I2. Determinismo: mesma entrada → mesma saída
 *  I3. Monotonicidade: adicionar feedbacks negativos nunca melhora health
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';

type HealthStatus = 'GREAT' | 'WARNING' | 'CRITICAL';

interface KnowledgeUnit {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
}

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

const MIN_TS = new Date('2020-01-01').getTime();
const MAX_TS = new Date('2026-12-31').getTime();

const tsArb = fc.integer({ min: MIN_TS, max: MAX_TS }).map((t) => new Date(t).toISOString());

const unitArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  positiveFeedbacks: fc.nat({ max: 1000 }),
  negativeFeedbacks: fc.nat({ max: 1000 }),
  createdAt: tsArb,
  updatedAt: tsArb,
});

const rank: Record<HealthStatus, number> = { GREAT: 0, WARNING: 1, CRITICAL: 2 };

describe('calculateHealth — invariantes (property-based)', () => {
  it('I1: sempre retorna um dos três status válidos', () => {
    fc.assert(
      fc.property(unitArb, (unit) => {
        const result = calculateHealth(unit);
        return result === 'GREAT' || result === 'WARNING' || result === 'CRITICAL';
      }),
      { numRuns: 1000 }
    );
  });

  it('I2: é determinístico (mesma entrada → mesma saída)', () => {
    fc.assert(
      fc.property(unitArb, (unit) => {
        return calculateHealth(unit) === calculateHealth(unit);
      }),
      { numRuns: 500 }
    );
  });

  it('I3: adicionar negativos nunca melhora o health', () => {
    fc.assert(
      fc.property(unitArb, fc.integer({ min: 1, max: 50 }), (unit, extraNegatives) => {
        const before = calculateHealth(unit);
        const after = calculateHealth({
          ...unit,
          negativeFeedbacks: unit.negativeFeedbacks + extraNegatives,
        });
        return rank[after] >= rank[before];
      }),
      { numRuns: 500 }
    );
  });
});
