import { db } from '@/db';
import { blindSpots } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const [result] = await db.delete(blindSpots)
            .where(eq(blindSpots.id, id))
            .returning();

        if (!result) {
            return NextResponse.json({ success: false, error: 'Blind spot not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error deleting blind spot:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
