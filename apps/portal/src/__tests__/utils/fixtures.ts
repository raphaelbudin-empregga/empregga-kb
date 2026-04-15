/**
 * Factories determinísticas para testes.
 *
 * Regra (07-convencoes-testing.md): nenhum teste cria objetos compostos inline.
 * Cada factory aceita overrides parciais para especializar apenas o que importa
 * ao teste específico.
 *
 * Types derivam de schemas Drizzle — se schema muda, factory quebra em compile-time.
 */

import type { InferSelectModel } from 'drizzle-orm';
import type {
  knowledgeUnits,
  knowledgeFeedbacks,
  blindSpots,
  systemEvents,
  admins,
} from '@/db/schema';

export type KnowledgeUnit = InferSelectModel<typeof knowledgeUnits>;
export type KnowledgeFeedback = InferSelectModel<typeof knowledgeFeedbacks>;
export type BlindSpot = InferSelectModel<typeof blindSpots>;
export type SystemEvent = InferSelectModel<typeof systemEvents>;
export type Admin = InferSelectModel<typeof admins>;

const FIXED_DATE = new Date('2026-04-15T12:00:00Z');

export const makeKnowledgeUnit = (overrides: Partial<KnowledgeUnit> = {}): KnowledgeUnit => ({
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Unidade de Teste',
  category: ['PLATAFORMA'],
  problemDescription: 'Descrição do problema padrão para testes.',
  officialResolution: 'Resolução oficial padrão para testes.',
  tags: [],
  targetAudience: ['AGENTE'],
  author: 'Fixture',
  status: 'PUBLISHED',
  version: 1,
  zammadRef: null,
  embedding: null,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  deletedAt: null,
  ...overrides,
});

export const makeKnowledgeFeedback = (
  overrides: Partial<KnowledgeFeedback> = {}
): KnowledgeFeedback => ({
  id: '00000000-0000-0000-0000-000000000010',
  knowledgeUnitId: '00000000-0000-0000-0000-000000000001',
  isPositive: true,
  createdAt: FIXED_DATE,
  ...overrides,
});

export const makeBlindSpot = (overrides: Partial<BlindSpot> = {}): BlindSpot => ({
  id: '00000000-0000-0000-0000-000000000020',
  query: 'Como faço uma rescisão por justa causa?',
  resolved: false,
  createdAt: FIXED_DATE,
  ...overrides,
});

export const makeSystemEvent = (overrides: Partial<SystemEvent> = {}): SystemEvent => ({
  id: '00000000-0000-0000-0000-000000000030',
  eventType: 'CHAT_QUERY',
  createdAt: FIXED_DATE,
  ...overrides,
});

export const makeAdmin = (overrides: Partial<Admin> = {}): Admin => ({
  id: '00000000-0000-0000-0000-000000000040',
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  createdAt: FIXED_DATE,
  ...overrides,
});
