import { db } from '@/db';
import { blindSpots } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        const spots = await db.select().from(blindSpots).orderBy(desc(blindSpots.createdAt)).limit(50);
        return NextResponse.json({ success: true, data: spots });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
