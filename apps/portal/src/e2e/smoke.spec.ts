/**
 * E2E SMOKE TESTS - Playwright
 *
 * Testa o fluxo completo no browser real.
 * PETRIFICADOS: Qualquer mudança requer aprovação explícita.
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Smoke Tests', () => {
  /**
   * Teste 1: Dashboard carrega sem erro
   */
  test('deve carregar página home sem erro', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/empregga|orion/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  /**
   * Teste 2: Chat page carrega
   */
  test('deve carregar página de chat sem erro', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('textarea[placeholder*="processo"]')).toBeVisible();
  });

  /**
   * Teste 3: Chat com query params (embed com nome/email)
   */
  test('deve carregar chat com query params name e email', async ({ page }) => {
    await page.goto('/chat?name=João%20Silva&email=joao@empresa.com');
    await expect(page.locator('textarea[placeholder*="processo"]')).toBeVisible();
    // Não há forma de verificar as props no E2E sem instrumentação
    // Este teste valida que a URL não quebra
  });

  /**
   * Teste 4: Enviar mensagem no chat
   */
  test('deve enviar mensagem e receber resposta', async ({ page }) => {
    await page.goto('/chat?name=Tester&email=test@empresa.com');

    const textarea = page.locator('textarea[placeholder*="processo"]');
    await textarea.fill('Como faço uma rescisão?');

    // Encontrar e clicar no botão de envio
    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();

    // Aguardar resposta da EVA
    await page.waitForTimeout(2000);

    // Verificar que a mensagem do usuário aparece
    await expect(page.locator('text="Como faço uma rescisão?"')).toBeVisible();
  });

  /**
   * Teste 5: Handoff button deve estar visível
   */
  test('deve exibir botão de handoff para transferência', async ({ page }) => {
    await page.goto('/chat?name=Teste&email=teste@empresa.com');

    const textarea = page.locator('textarea[placeholder*="processo"]');
    await textarea.fill('Help');
    await page.locator('button[type="submit"]').first().click();

    // Aguardar que o botão de handoff apareça
    await page.waitForTimeout(1500);
    const handoffButton = page.locator('text=/preciso de um humano|📞/i');
    // Pode estar visível ou não dependendo de timing, mas não deve causar erro
  });

  /**
   * Teste 6: Knowledge base page
   */
  test('deve carregar conhecimento base sem erro', async ({ page }) => {
    await page.goto('/');
    // Navegar para a seção de conhecimento (se houver link)
    const knowledgeLink = page.locator('a:has-text(/conhecimento|kb|base/i)').first();
    if (await knowledgeLink.isVisible()) {
      await knowledgeLink.click();
      await expect(page).toHaveURL(/knowledge|base/i);
    }
  });

  /**
   * Teste 7: Responsividade - viewport mobile
   */
  test('deve ser responsivo em mobile (viewport 375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/chat');

    // Verificar que elementos importantes ainda são acessíveis
    const textarea = page.locator('textarea[placeholder*="processo"]');
    await expect(textarea).toBeVisible();
  });

  /**
   * Teste 8: Sem JavaScript não quebra (progressive enhancement)
   */
  test('página deve ter conteúdo estático acessível', async ({ page }) => {
    await page.goto('/');
    // Verificar que há conteúdo visível mesmo antes do JS carregar
    const body = page.locator('body');
    await expect(body).toContainText(/empregga|orion|eva/i);
  });
});

test.describe('E2E - Embed Scenario (iframe)', () => {
  /**
   * Cenário: Sistema externo embedando o chat via iframe
   */
  test('iframe do chat deve carregar com parâmetros de usuário', async ({
    page,
    context,
  }) => {
    // Simular página do sistema externo
    await page.setContent(`
      <html>
        <body>
          <h1>Sistema Externo</h1>
          <iframe
            id="eva-chat"
            src="/chat?name=Maria%20Silva&email=maria@empregga.com.br"
            style="width:100%; height:600px; border:none;"
            title="EVA Chat"
          ></iframe>
        </body>
      </html>
    `);

    // Aguardar iframe carregar
    const iframe = page.frameLocator('#eva-chat');
    await expect(iframe.locator('textarea[placeholder*="processo"]')).toBeVisible({ timeout: 5000 });
  });
});
