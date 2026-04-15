/**
 * INTEGRATION — Import Orion
 *
 * Gap G11. Executar o importer duas vezes seguidas não deve duplicar
 * unidades. Idempotência é invariante crítica.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const isCI = process.env.CI === 'true';

describe.skipIf(!isCI)('Integration — Import Orion (idempotência)', () => {
  let pool: import('pg').Pool | null = null;

  beforeAll(async () => {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('rodar importKnowledgeBase 2x não duplica registros', async () => {
    expect(pool).not.toBeNull();
    const { importKnowledgeBase } = await import('@/utils/import-orion');

    const before = await pool!.query('SELECT COUNT(*)::int AS n FROM knowledge_units');

    await importKnowledgeBase();
    const afterFirst = await pool!.query('SELECT COUNT(*)::int AS n FROM knowledge_units');
    const createdFirst = afterFirst.rows[0].n - before.rows[0].n;
    expect(createdFirst).toBeGreaterThanOrEqual(0);

    await importKnowledgeBase();
    const afterSecond = await pool!.query('SELECT COUNT(*)::int AS n FROM knowledge_units');

    expect(afterSecond.rows[0].n).toBe(afterFirst.rows[0].n);
  });
});
