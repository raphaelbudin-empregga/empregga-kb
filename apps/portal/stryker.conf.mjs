/**
 * Stryker — Mutation Testing
 *
 * Rodado semanalmente via .github/workflows/stryker.yml (não em cada PR
 * — 5-15min). Mede se testes detectam mudanças reais de comportamento.
 *
 * Threshold: >= 70% de mutações mortas (break < 60).
 */
export default {
  mutate: [
    'src/utils/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/utils/test-minio-*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
  ],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  coverageAnalysis: 'perTest',
  thresholds: { high: 80, low: 60, break: 60 },
  reporters: ['html', 'progress', 'clear-text'],
  timeoutMS: 60_000,
  concurrency: 4,
  tempDirName: '.stryker-tmp',
};
