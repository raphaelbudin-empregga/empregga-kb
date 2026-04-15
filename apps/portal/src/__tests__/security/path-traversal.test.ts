/**
 * SECURITY — Path Traversal
 *
 * Gap G1. Filenames maliciosos em /api/upload não devem permitir
 * escrita fora do bucket/diretório designado.
 */

import { describe, it, expect } from 'vitest';

const traversalPayloads = [
  '../../etc/passwd',
  '..\\..\\windows\\system32\\config\\sam',
  '/etc/passwd',
  'C:\\Windows\\System32\\drivers\\etc\\hosts',
  '....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
];

describe('Security — Path Traversal', () => {
  describe('POST /api/upload', () => {
    it.each(traversalPayloads)('rejeita ou sanitiza filename: %s', async (filename) => {
      const formData = new FormData();
      const file = new Blob(['conteúdo de teste'], { type: 'text/plain' });
      formData.append('file', file, filename);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Invariante: qualquer que seja a resposta, não deve expor path
      // com sequência de traversal nem caminho absoluto do servidor.
      const bodyText = await response.text();
      expect(bodyText).not.toMatch(/\.\.[\\/]/);
      expect(bodyText).not.toMatch(/[A-Z]:[\\/]Windows/i);
      expect(bodyText).not.toMatch(/\/etc\/passwd/);
    });
  });
});
