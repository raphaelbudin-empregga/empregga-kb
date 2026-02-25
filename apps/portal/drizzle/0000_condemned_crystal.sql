CREATE TABLE "knowledge_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"problem_description" text NOT NULL,
	"official_resolution" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_audience" jsonb DEFAULT '["AGENTE"]'::jsonb NOT NULL,
	"author" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"zammad_ref" text,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
