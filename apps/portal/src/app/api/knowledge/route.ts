import { db } from '@/db';
import { knowledgeUnits, knowledgeFeedbacks } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql, desc } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Inserção básica no Postgres da VPS
        const [result] = await db.insert(knowledgeUnits).values({
            title: body.title,
            category: body.category,
            problemDescription: body.problemDescription,
            officialResolution: body.officialResolution,
            tags: body.tags || [],
            author: body.author || 'Agente Empregga',
            status: 'PUBLISHED',
            targetAudience: ['AGENTE'],
        }).returning();

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('CRITICAL DATABASE ERROR:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            detail: error.code === 'ECONNREFUSED' ? 'VPS Connection Refused' : 'Query Failure'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const unitsWithFeedback = await db
            .select({
                id: knowledgeUnits.id,
                title: knowledgeUnits.title,
                category: knowledgeUnits.category,
                author: knowledgeUnits.author,
                problemDescription: knowledgeUnits.problemDescription,
                officialResolution: knowledgeUnits.officialResolution,
                createdAt: knowledgeUnits.createdAt,
                updatedAt: knowledgeUnits.updatedAt,
                status: knowledgeUnits.status,
                positiveFeedbacks: sql<number>`count(case when ${knowledgeFeedbacks.isPositive} = true then 1 end)::int`,
                negativeFeedbacks: sql<number>`count(case when ${knowledgeFeedbacks.isPositive} = false then 1 end)::int`,
            })
            .from(knowledgeUnits)
            .leftJoin(knowledgeFeedbacks, eq(knowledgeUnits.id, knowledgeFeedbacks.knowledgeUnitId))
            .groupBy(knowledgeUnits.id)
            .orderBy(desc(knowledgeUnits.createdAt));

        return NextResponse.json({ success: true, data: unitsWithFeedback });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

