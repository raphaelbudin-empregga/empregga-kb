import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeFeedbacks } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { feedbackType, sources } = body;

        // Valida payload
        if (!feedbackType || !['up', 'down'].includes(feedbackType) || !sources || !Array.isArray(sources)) {
            return NextResponse.json({ error: 'Payload inválido. "feedbackType" e "sources" são obrigatórios.' }, { status: 400 });
        }

        const isPositive = feedbackType === 'up';

        if (sources.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhuma fonte atrelada para receber feedback.' });
        }

        // Cada Unidade de Conhecimento usada como fonte na resposta recebe o mesmo feedback (Trust Score coletivo para aquela query).
        for (const source of sources) {
            await db.insert(knowledgeFeedbacks).values({
                id: uuidv4(),
                knowledgeUnitId: source.id,
                isPositive,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao salvar feedback do RAG:', error);
        return NextResponse.json({ error: 'Falha salvando feedback', details: error.message }, { status: 500 });
    }
}
