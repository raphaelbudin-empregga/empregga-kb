import { db } from '@/db';
import { systemEvents, knowledgeFeedbacks, knowledgeUnits } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql, desc, count } from 'drizzle-orm';

export async function GET() {
    try {
        const [queriesCount] = await db.select({ value: count() }).from(systemEvents).where(eq(systemEvents.eventType, 'CHAT_QUERY'));
        const [handoffsCount] = await db.select({ value: count() }).from(systemEvents).where(eq(systemEvents.eventType, 'HANDOFF'));

        const totalQueries = queriesCount.value || 0;
        const totalHandoffs = handoffsCount.value || 0;
        const resolutionRate = totalQueries > 0 ? ((totalQueries - totalHandoffs) / totalQueries) * 100 : 0;

        const worstUnits = await db.select({
            id: knowledgeUnits.id,
            title: knowledgeUnits.title,
            negativeCount: sql<number>`count(case when ${knowledgeFeedbacks.isPositive} = false then 1 end)::int`
        })
            .from(knowledgeUnits)
            .leftJoin(knowledgeFeedbacks, eq(knowledgeUnits.id, knowledgeFeedbacks.knowledgeUnitId))
            .groupBy(knowledgeUnits.id)
            .having(sql`count(case when ${knowledgeFeedbacks.isPositive} = false then 1 end) > 0`)
            .orderBy(desc(sql`count(case when ${knowledgeFeedbacks.isPositive} = false then 1 end)`))
            .limit(5);

        return NextResponse.json({
            success: true,
            data: {
                totalQueries,
                totalHandoffs,
                resolutionRate: Math.round(resolutionRate),
                worstUnits
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
