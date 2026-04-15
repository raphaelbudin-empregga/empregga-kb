/**
 * E2E — Acessibilidade (aXe-core)
 *
 * Gap G8. Páginas principais não devem ter violações critical/serious.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pagesToTest = [
  { name: 'home', path: '/' },
  { name: 'chat', path: '/chat' },
  { name: 'login', path: '/login' },
];

for (const { name, path } of pagesToTest) {
  test(`${name} — sem violações critical/serious de acessibilidade`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
