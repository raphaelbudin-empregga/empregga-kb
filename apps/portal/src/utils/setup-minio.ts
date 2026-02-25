import { ensureBucket } from './minio';

async function setup() {
    console.log('--- Iniciando Setup do Minio ---');
    await ensureBucket();
    console.log('--- Setup Concluído ---');
    process.exit(0);
}

setup();
