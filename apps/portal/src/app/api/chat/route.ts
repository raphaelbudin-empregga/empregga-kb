import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeUnits, blindSpots, systemEvents } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { cosineDistance, desc, sql } from 'drizzle-orm';

import { getEmbedding } from '@/utils/embeddings';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages } = body;

        // Logando Query no Analytics de Forma Silenciosa
        db.insert(systemEvents).values({ id: uuidv4(), eventType: 'CHAT_QUERY' }).execute().catch(e => console.error(e));

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Nenhuma mensagem recebida' }, { status: 400 });
        }

        // 1. Pega a última pergunta do usuário
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        if (!lastUserMessage) {
            return NextResponse.json({ error: 'Nenhuma pergunta de usuário encontrada' }, { status: 400 });
        }

        const query = lastUserMessage.content;

        // 2. Transforma a pergunta em vetor (Embedding)
        const queryEmbedding = await getEmbedding(query);

        // 3. Busca Contexto no Postgres (Vector RAG)
        // Confiança (Trust Score): Similaridade do cosseno
        const results = await db
            .select({
                id: knowledgeUnits.id,
                title: knowledgeUnits.title,
                problemDescription: knowledgeUnits.problemDescription,
                officialResolution: knowledgeUnits.officialResolution,
                similarity: sql<number>`1 - (${cosineDistance(knowledgeUnits.embedding, queryEmbedding)})`
            })
            .from(knowledgeUnits)
            .orderBy((t) => desc(t.similarity))
            .limit(4);

        // 4. Constrói o Contexto Contextual
        // Apenas unidades com similaridade razoável (> 0.6)
        const relevantUnits = results.filter(r => r.similarity > 0.6);

        let contextText = relevantUnits.map(unit => `
[Unidade ID: ${unit.id} | Título: ${unit.title}]
Problema: ${unit.problemDescription}
Resolução Oficial: ${unit.officialResolution}
`).join('\n---\n');

        if (relevantUnits.length === 0) {
            contextText = "NENHUM DADO ENCONTRADO NA BASE DE CONHECIMENTO PARA ESSA PERGUNTA.";
        }

        // 5. System Prompt + Self-Reflection + Formatação JSON
        const systemPrompt = `
Você é a EVA, a Assistente Especialista da Empregga (Sistema Orion).
Sua missão é ajudar profissionais de RH com base EXCLUSIVAMENTE no contexto fornecido abaixo.

**SUA REGRA DE OURO (CRÍTICA):**
Você **NÃO** possui conhecimento geral sobre o mundo. Você deve ignorar todo o seu conhecimento prévio de treinamento. Seu universo de conhecimento é **EXCLUSIVAMENTE** o conteúdo retornado pela "BASE DE CONHECIMENTO DISPONÍVEL" abaixo.
- Se a resposta não estiver explícita na Base de Conhecimento, marque has_answer como false e responda exatamente: "Desculpe, não consigo atender essa demanda no momento. Criar um ticket de suporte no link: https://empregga.com.br/abertura-de-ticket-agentes-empregga/. **Fique Atenta ao seu email para receber a resposta**".

**Diretrizes de Resposta:**
1. **Sintetize e Estruture**: Não copie parágrafos longos cruamente. Use linguagem acessível, estruture em passos.
2. **Regra de Suporte Proativo (Guia Operacional)**: Se a pergunta for sobre uma etapa de um processo (Ex: cadastrar, transferir), foque na etapa solicitada, mas inclua um resumo (outline) das etapas contextuais (o que acontece antes e depois) e sobre os pré-requisitos para dar o contexto completo.
3. **Formatação Visual (Markdown)**:
   - Use **Negrito** para destacar conceitos-chave, nomes de ferramentas e avisos.
   - Use Listas Numéricas para passo a passo.
   - Use \`Code Block\` para botões ou menus.
4. **Saudações Genéricas**: Se a pergunta do usuário for apenas "Oi", "Tudo bem?", cumprimente cordialmente e pergunte como pode ajudar na operação hoje, e marque has_answer como true.

=== BASE DE CONHECIMENTO DISPONÍVEL ===
${contextText}
========================================

VOCÊ DEVE RESPONDER EXATAMENTE NESTE FORMATO JSON:
{
  "has_answer": true ou false,
  "response": "Sua resposta final formatada em Markdown aqui. Lembre-se de ser detalhada e proativa conforme as regras."
}
`;

        const openaiMessages = [
            { role: 'system', content: systemPrompt },
            // Enviamos apenas o histórico recente para não estourar tokens e não confundir o contexto
            ...messages.slice(-3).map((m: { role: string, content: string }) => ({ role: m.role, content: m.content }))
        ];

        // 6. Chamada LLM Otimizada (GPT-4o-mini)
        const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: openaiMessages,
                response_format: { type: 'json_object' },
                temperature: 0.1 // Baixa temperatura para RAG mais factual
            })
        });

        if (!llmResponse.ok) {
            throw new Error(`Erro OpenAI: ${llmResponse.statusText}`);
        }

        const data = await llmResponse.json();
        const jsonOutput = JSON.parse(data.choices[0].message.content);

        // Se a EVA não tem certeza da resposta (Blind Spot), gravamos a pergunta no banco de dados para Curadoria
        if (jsonOutput.has_answer === false) {
            // Disparado de forma não bloqueante
            db.insert(blindSpots).values({
                id: uuidv4(),
                query: query
            }).execute().catch(e => console.error("Erro catalogando Blind Spot:", e));
        }

        return NextResponse.json({
            hasAnswer: jsonOutput.has_answer,
            response: jsonOutput.response,
            sources: relevantUnits.map(u => ({ id: u.id, title: u.title, similarity: u.similarity }))
        });

    } catch (error: any) {
        console.error('Erro no RAG Chat:', error);
        return NextResponse.json({ error: 'Falha processando o chat', details: error.message }, { status: 500 });
    }
}
