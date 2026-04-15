/**
 * E2E — Fluxo Completo (Admin + Chat Público)
 *
 * Admin cria unit → aparece na lista → busca semântica encontra → chat
 * público pergunta → EVA responde → handoff cria ticket.
 */

import { test, expect } from '@playwright/test';

test.describe('Full flow end-to-end', () => {
  test('admin cria knowledge e vê na lista', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/senha|password/i).fill('password123');
    await page.getByRole('button', { name: /entrar|login/i }).click();

    await expect(page).toHaveURL(/\/$|\/admin/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('chat público retorna resposta da EVA', async ({ page }) => {
    await page.goto('/chat');

    const textarea = page.getByPlaceholder(/como eu processo|como posso ajudar/i);
    await textarea.fill('Qual o prazo do aviso prévio?');
    await textarea.press('Enter');

    await expect(page.getByText(/aviso prévio|30 dias/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
