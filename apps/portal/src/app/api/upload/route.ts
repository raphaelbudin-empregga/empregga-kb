import { NextRequest, NextResponse } from 'next/server';
import { minioClient, BUCKET_NAME } from '@/utils/minio';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
        const contentType = file.type || 'application/octet-stream';

        // Upload para o Minio
        await minioClient.putObject(
            BUCKET_NAME,
            fileName,
            buffer,
            buffer.length,
            { 'Content-Type': contentType }
        );

        // Gera a URL pública via Traefik (HTTPS)
        const publicUrl = `https://${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${fileName}`;

        return NextResponse.json({
            url: publicUrl,
            fileName: fileName,
            size: buffer.length
        });
    } catch (error: any) {
        console.error('Erro no upload para Minio:', error);
        return NextResponse.json({
            error: 'Erro ao fazer upload para o storage',
            details: error.message
        }, { status: 500 });
    }
}
