import { db } from '@/db';
import { knowledgeUnits } from '@/db/schema';
import { NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { ids, action } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });
        }

        if (action === 'delete') {
            await db.update(knowledgeUnits)
                .set({ deletedAt: new Date() })
                .where(inArray(knowledgeUnits.id, ids));
        } else if (action === 'restore') {
            await db.update(knowledgeUnits)
                .set({ deletedAt: null, updatedAt: new Date() })
                .where(inArray(knowledgeUnits.id, ids));
        } else {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error: any) {
        console.error('Error in bulk operation:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
