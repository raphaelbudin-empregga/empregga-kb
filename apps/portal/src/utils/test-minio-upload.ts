import { minioClient, BUCKET_NAME } from './minio';

async function testUpload() {
    console.log('--- Testando Upload Direto ---');
    try {
        const buffer = Buffer.from('teste de conteúdo');
        await minioClient.putObject(BUCKET_NAME, 'test-file.txt', buffer);
        console.log('Upload bem sucedido!');
    } catch (error: any) {
        console.error('Erro no upload:', error);
    }
}

testUpload();
