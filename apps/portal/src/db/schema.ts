import { pgTable, text, timestamp, uuid, integer, jsonb, vector, boolean } from 'drizzle-orm/pg-core';

export const knowledgeUnits = pgTable('knowledge_units', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    problemDescription: text('problem_description').notNull(),
    officialResolution: text('official_resolution').notNull(),
    tags: jsonb('tags').$type<string[]>().default([]).notNull(),
    targetAudience: jsonb('target_audience').$type<string[]>().default(['AGENTE']).notNull(),
    author: text('author').notNull(),
    status: text('status').default('DRAFT').notNull(),
    version: integer('version').default(1).notNull(),
    zammadRef: text('zammad_ref'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
});

export const knowledgeFeedbacks = pgTable('knowledge_feedbacks', {
    id: uuid('id').primaryKey().defaultRandom(),
    knowledgeUnitId: uuid('knowledge_unit_id').references(() => knowledgeUnits.id).notNull(),
    isPositive: boolean('is_positive').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const blindSpots = pgTable('blind_spots', {
    id: uuid('id').primaryKey().defaultRandom(),
    query: text('query').notNull(),
    resolved: boolean('resolved').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemEvents = pgTable('system_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: text('event_type').notNull(), // 'CHAT_QUERY' | 'HANDOFF'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const admins = pgTable('admins', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(), // Hash ou senha simples para este MVP
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
