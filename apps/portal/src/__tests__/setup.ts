import { expect, afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { server } from './__mocks__/server';

// Mockar variáveis de ambiente para testes
process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3000';

// Set a fixed system time for all tests to make date-based calculations deterministic
// This must be done at module load time, before tests define their own "now" variables
vi.setSystemTime(new Date('2024-04-14T12:00:00Z'));

// MSW setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mockar fetch global se não existir (não necessário em Node 18+, mas por segurança)
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock scrollIntoView que jsdom não implementa nativamente
window.HTMLElement.prototype.scrollIntoView = vi.fn();
