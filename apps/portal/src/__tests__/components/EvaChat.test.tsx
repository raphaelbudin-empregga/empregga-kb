/**
 * COMPONENT TESTS — EvaChat
 *
 * Testa props, renderização e interações básicas. Não testa o streaming real
 * (responsabilidade do teste de integração em api/chat).
 *
 * PETRIFICADOS: correção de armadilhas aprovada em 2026-04-15
 * (CR-12, CR-13 em 02-problemas-identificados.md).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EvaChat from '@/components/EvaChat';

describe('EvaChat component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('renderização', () => {
    it('renderiza textarea com placeholder quando recebe props de usuário', () => {
      render(<EvaChat userName="João Silva" userEmail="joao@empregga.com.br" />);
      expect(screen.getByPlaceholderText(/como eu processo/i)).toBeInTheDocument();
    });

    it('renderiza sem erro quando props são omitidas (fallback interno)', () => {
      render(<EvaChat />);
      expect(screen.getByPlaceholderText(/como eu processo/i)).toBeInTheDocument();
    });

    it('exibe mensagem de boas-vindas da EVA', () => {
      render(<EvaChat userName="Teste" userEmail="teste@empresa.com" />);

      const paragraphs = screen.getAllByRole('paragraph');
      const welcomeMessage = paragraphs.find((p) => {
        const text = p.textContent?.toLowerCase() ?? '';
        return text.includes('olá') && text.includes('eva') && text.includes('assistente virtual');
      });

      expect(welcomeMessage).toBeInTheDocument();
    });
  });

  describe('interações de input', () => {
    it('permite o usuário digitar mensagem no textarea', async () => {
      const user = userEvent.setup();
      render(<EvaChat userName="Teste" userEmail="teste@empresa.com" />);

      const textarea = screen.getByPlaceholderText(/como eu processo/i);
      await user.type(textarea, 'Olá EVA');

      expect(textarea).toHaveValue('Olá EVA');
    });

    it('limpa o textarea após enviar via clique no botão', async () => {
      const user = userEvent.setup();
      render(<EvaChat userName="Teste" userEmail="teste@empresa.com" />);

      const textarea = screen.getByPlaceholderText(/como eu processo/i);
      await user.type(textarea, 'Teste');

      const sendButton = screen.getByRole('button', { name: /enviar/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      }, { timeout: 2000 });
    });

    it('limpa o textarea após enviar via tecla Enter', async () => {
      const user = userEvent.setup();
      render(<EvaChat userName="Teste" userEmail="teste@empresa.com" />);

      const textarea = screen.getByPlaceholderText(/como eu processo/i);
      await user.type(textarea, 'Hello{Enter}');

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      }, { timeout: 2000 });
    });
  });
});
