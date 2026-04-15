/**
 * AI-QUALITY — LLM-as-Judge para EVA
 *
 * Gap G6. Opt-in via env RUN_AI_QUALITY=true (custo ~$0.01/rodada com
 * Haiku 4.5). Em CI, rodado apenas em PRs para main.
 *
 * Pipeline:
 *  1. Carrega golden dataset (docs/qa/golden-dataset/eva-qa.jsonl)
 *  2. Para cada caso: chama /api/chat com a pergunta
 *  3. Validação determinística: forbidden_content nunca presente
 *  4. Validação semântica: Claude Haiku 4.5 avalia relevância,
 *     correção e tom em escala 1-5
 *  5. Thresholds: cada dimensão >= 4
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

interface GoldenCase {
  id: string;
  question: string;
  expected_topics: string[];
  forbidden_content: string[];
  must_cite_source: boolean;
  tone: string;
}

interface JudgeScore {
  relevance: number;
  correctness: number;
  tone: number;
  reasoning: string;
}

const shouldRun = process.env.RUN_AI_QUALITY === 'true';
const datasetPath = path.resolve(
  __dirname,
  '../../../docs/qa/golden-dataset/eva-qa.jsonl'
);

const loadDataset = (): GoldenCase[] => {
  if (!existsSync(datasetPath)) return [];
  return readFileSync(datasetPath, 'utf-8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l) as GoldenCase);
};

const judgeRubric = `
Avalie a resposta da EVA (assistente virtual trabalhista brasileira) em 3 dimensões (escala 1-5):
- relevance: a resposta endereça diretamente a pergunta?
- correctness: os fatos jurídicos mencionados estão corretos conforme CLT?
- tone: tom formal-empático apropriado para atendimento profissional?

Retorne APENAS JSON válido no formato:
{ "relevance": number, "correctness": number, "tone": number, "reasoning": "..." }
`.trim();

describe.skipIf(!shouldRun)('AI-Quality — LLM-as-Judge EVA', () => {
  let dataset: GoldenCase[] = [];
  let Anthropic: typeof import('@anthropic-ai/sdk').default;

  beforeAll(async () => {
    dataset = loadDataset();
    const mod = await import('@anthropic-ai/sdk');
    Anthropic = mod.default;
  });

  it('dataset carregado possui pelo menos 5 casos', () => {
    expect(dataset.length).toBeGreaterThanOrEqual(5);
  });

  it.each(loadDataset())(
    'EVA responde caso $id sem forbidden content e com scores >= 4',
    async ({ question, forbidden_content }) => {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
      });
      expect(chatResponse.status).toBe(200);
      const { response } = (await chatResponse.json()) as { response: string };
      expect(response).toBeTruthy();

      for (const forbidden of forbidden_content) {
        expect(response.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }

      const client = new Anthropic();
      const judgment = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `${judgeRubric}\n\nPergunta:\n${question}\n\nResposta da EVA:\n${response}`,
          },
        ],
      });

      const text = judgment.content
        .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('');
      const score = JSON.parse(text) as JudgeScore;

      expect(score.relevance).toBeGreaterThanOrEqual(4);
      expect(score.correctness).toBeGreaterThanOrEqual(4);
      expect(score.tone).toBeGreaterThanOrEqual(4);
    },
    60_000
  );
});
