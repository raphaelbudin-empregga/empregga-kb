#!/usr/bin/env node
/**
 * analyze-flaky.mjs — compara N resultados do Vitest (--reporter=json)
 * e lista testes com resultado não-determinístico.
 *
 * Uso: node scripts/analyze-flaky.mjs flaky-runs/*.json
 */

import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (files.length < 2) {
  console.error('Uso: analyze-flaky.mjs <run-1.json> <run-2.json> [...]');
  process.exit(1);
}

/** @type {Map<string, Set<string>>} */
const results = new Map();

for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    console.error(`# Ignorando ${file} (JSON inválido)`);
    continue;
  }

  for (const suite of data.testResults ?? []) {
    for (const test of suite.assertionResults ?? []) {
      const key = `${suite.name} > ${test.fullName ?? test.title}`;
      if (!results.has(key)) results.set(key, new Set());
      results.get(key).add(test.status);
    }
  }
}

const flaky = [...results.entries()].filter(([, statuses]) => statuses.size > 1);

console.log('# Flaky Test Report\n');
console.log(`Total runs analisados: ${files.length}`);
console.log(`Testes únicos: ${results.size}`);
console.log(`Flaky detectados: ${flaky.length}\n`);

if (flaky.length === 0) {
  console.log('OK — nenhum teste não-determinístico encontrado.');
  process.exit(0);
}

console.log('## Lista\n');
for (const [name, statuses] of flaky) {
  console.log(`- \`${name}\` — statuses: ${[...statuses].join(', ')}`);
}
process.exit(1);
