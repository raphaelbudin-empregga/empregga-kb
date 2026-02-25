import * as Minio from 'minio';

if (!process.env.MINIO_ENDPOINT) {
    require('dotenv').config({ path: '.env.local' });
}

export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'knowledge-base';

// Garantir que o bucket existe
export async function ensureBucket() {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            // Tornar o bucket público para leitura (necessário para o portal exibir as imagens)
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetBucketLocation", "s3:ListBucket"],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}`]
                    },
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetObject"],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
                    }
                ]
            };
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
            console.log(`Bucket ${BUCKET_NAME} criado e configurado como público.`);
        }
    } catch (error) {
        console.error('Erro ao configurar bucket Minio:', error);
    }
}
