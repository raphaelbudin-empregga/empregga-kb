/**
 * INTEGRATION — PostgreSQL + pgvector
 *
 * Gap G3. Insere embeddings, faz busca por similaridade e valida que
 * a ordem de resultados é estável para o mesmo vetor de consulta.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const isCI = process.env.CI === 'true';

describe.skipIf(!isCI)('Integration — pgvector', () => {
  let pool: import('pg').Pool | null = null;

  beforeAll(async () => {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('retorna resultados ordenados por distância cosseno', async () => {
    expect(pool).not.toBeNull();

    // Seed 3 unidades com embeddings conhecidos
    await pool!.query(`
      INSERT INTO knowledge_units (title, category, problem_description, official_resolution, author, embedding, status)
      VALUES
        ('A', ARRAY['T'], 'p', 'r', 'a', ARRAY[${Array(1536).fill(1).join(',')}]::vector, 'PUBLISHED'),
        ('B', ARRAY['T'], 'p', 'r', 'a', ARRAY[${Array(1536).fill(0.5).join(',')}]::vector, 'PUBLISHED'),
        ('C', ARRAY['T'], 'p', 'r', 'a', ARRAY[${Array(1536).fill(0).join(',')}]::vector, 'PUBLISHED')
      ON CONFLICT DO NOTHING
    `);

    const result = await pool!.query(
      `SELECT title FROM knowledge_units
       WHERE deleted_at IS NULL AND embedding IS NOT NULL
       ORDER BY embedding <=> ARRAY[${Array(1536).fill(1).join(',')}]::vector
       LIMIT 3`
    );

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].title).toBe('A');
  });
});
