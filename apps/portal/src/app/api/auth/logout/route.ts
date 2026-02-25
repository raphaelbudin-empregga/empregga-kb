import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Destruir cookie
    response.cookies.delete('adminToken');

    return response;
}
