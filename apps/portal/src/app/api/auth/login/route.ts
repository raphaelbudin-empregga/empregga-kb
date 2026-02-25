import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Preencha email e senha' }, { status: 400 });
        }

        const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

        if (!admin) {
            return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Validação simples MVP
        if (admin.password !== password) {
            return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Emitir cookie de sessão
        const response = NextResponse.json({ success: true, user: { name: admin.name, email: admin.email } });

        response.cookies.set({
            name: 'adminToken',
            value: admin.id,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 semana
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
