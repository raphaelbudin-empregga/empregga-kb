// Usando fetch nativo do Node.js 18+

async function testConnection() {
    const urls = [
        'https://api.minio.empregga.com.br/minio/health/live',
        'https://api.minio.empregga.com.br',
        'https://minio.empregga.com.br/minio/health/live',
        'https://minio.empregga.com.br'
    ];

    console.log('--- Testando Conectividade Minio ---');
    for (const url of urls) {
        try {
            console.log(`Testando: ${url}...`);
            const res = await fetch(url);
            console.log(`Status: ${res.status} ${res.statusText}`);
            if (res.status === 200) {
                console.log('Conexão bem sucedida!');
            }
        } catch (error: any) {
            console.error(`Erro ao conectar em ${url}:`, error.message);
        }
    }
    console.log('--- Fim do Teste ---');
}

testConnection();
