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

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Nenhuma mensagem recebida' }, { status: 400 });
        }

        // --- PAUSA RAG INTERNO (Conforme solicitação) ---
        /*
        // 1. Pega a última pergunta do usuário
        const lastUserMessage = messages.slice().reverse().find((m: ChatMessage) => m.role === 'user');
        if (!lastUserMessage) {
            return NextResponse.json({ error: 'Nenhuma pergunta de usuário encontrada' }, { status: 400 });
        }

        const query = lastUserMessage.content;

        // 2. Transforma a pergunta em vetor (Embedding)
        const queryEmbedding = await getEmbedding(query);

        // 3. Busca Contexto no Postgres (Vector RAG)
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
        const relevantUnits = results.filter(r => r.similarity > 0.6);
        ... (resto da lógica interna)
        */

        // --- INTEGRAÇÃO N8N WEBHOOK ---
        const response = await fetch('https://n8nwebhook.empregga.com.br/webhook/cx-cativa-teste', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                timestamp: new Date().toISOString(),
                source: 'orion-portal'
            })
        });

        if (!response.ok) {
            throw new Error(`Erro no Webhook n8n: ${response.statusText}`);
        }

        const n8nData = await response.json();

        // Mapeamento do retorno do n8n para o formato esperado pelo EvaChat
        // Assumindo que o n8n retorna { response: string, hasAnswer: boolean, sources?: [] }
        return NextResponse.json({
            hasAnswer: n8nData.hasAnswer ?? true,
            response: n8nData.response || n8nData.output || 'Desculpe, não recebi uma resposta válida do motor n8n.',
            sources: n8nData.sources || []
        });

    } catch (error: any) {
        console.error('Erro no RAG Chat (n8n Path):', error);
        return NextResponse.json({ error: 'Falha processando o chat via n8n', details: error.message }, { status: 500 });
    }
}
