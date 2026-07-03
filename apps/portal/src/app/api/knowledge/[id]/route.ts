import { db } from '@/db';
import { knowledgeUnits } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getEmbedding } from '@/utils/embeddings';

function buildEmbeddingText(title: string, problemDescription: string, officialResolution: string): string {
    return `${title}\n\n${problemDescription}\n\n${officialResolution}`;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const body = await request.json();
        const { id } = await context.params;

        // If body contains restore=true, we just clear the deletedAt flag
        if (body.restore) {
            const [result] = await db.update(knowledgeUnits)
                .set({ deletedAt: null, updatedAt: new Date() })
                .where(eq(knowledgeUnits.id, id))
                .returning();
            return NextResponse.json({ success: true, data: result });
        }

        // Otherwise, it's a full edit — regenerate embedding for updated content
        const embeddingText = buildEmbeddingText(body.title, body.problemDescription, body.officialResolution);
        const embedding = await getEmbedding(embeddingText);

        const [result] = await db.update(knowledgeUnits)
            .set({
                title: body.title,
                category: body.category,
                problemDescription: body.problemDescription,
                officialResolution: body.officialResolution,
                embedding,
                updatedAt: new Date(),
            })
            .where(eq(knowledgeUnits.id, id))
            .returning();

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error updating knowledge unit:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        // Soft delete: set deletedAt to current date
        const [result] = await db.update(knowledgeUnits)
            .set({ deletedAt: new Date() })
            .where(eq(knowledgeUnits.id, id))
            .returning();

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error deleting knowledge unit:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
