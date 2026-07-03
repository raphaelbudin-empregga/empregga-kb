import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
        }

        const existing = await db.select({ id: admins.id }).from(admins).limit(1);
        if (existing.length > 0) {
            return NextResponse.json({ success: false, error: 'Setup já realizado. Peça a um admin existente para criar seu acesso.' }, { status: 403 });
        }

        await db.insert(admins).values({
            id: uuidv4(),
            email,
            password, // Em produção usar bcrypt
            name
        });

        return NextResponse.json({ success: true, message: 'Admin criado com sucesso' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
