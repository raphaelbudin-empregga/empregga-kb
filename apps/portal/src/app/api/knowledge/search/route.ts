import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeUnits } from '@/db/schema';
import { getEmbedding } from '@/utils/embeddings';
import { cosineDistance, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        // 1. Gera embedding para a pergunta do usuário
        const queryEmbedding = await getEmbedding(query);

        // 2. Busca no banco por similaridade de cosseno
        // Usamos a função cosineDistance do Drizzle
        const results = await db
            .select({
                id: knowledgeUnits.id,
                title: knowledgeUnits.title,
                category: knowledgeUnits.category,
                problemDescription: knowledgeUnits.problemDescription,
                officialResolution: knowledgeUnits.officialResolution,
                author: knowledgeUnits.author,
                status: knowledgeUnits.status,
                createdAt: knowledgeUnits.createdAt,
                updatedAt: knowledgeUnits.updatedAt,
                similarity: sql<number>`1 - (${cosineDistance(knowledgeUnits.embedding, queryEmbedding)})`
            })
            .from(knowledgeUnits)
            .orderBy((t) => desc(t.similarity))
            .limit(5);

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Erro na busca semântica:', error);
        return NextResponse.json({ error: 'Erro ao processar busca semântica', details: error.message }, { status: 500 });
    }
}
