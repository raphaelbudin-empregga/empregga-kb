async function testCommonPorts() {
    const ports = [9000, 9001, 8080, 8443, 80, 443];
    const host = 'minio.empregga.com.br';

    console.log(`--- Testando Portas em ${host} ---`);
    for (const port of ports) {
        try {
            const url = `http://${host}:${port}/minio/health/live`;
            console.log(`Testando Porta ${port}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.log(`Porta ${port}: ${res.status} ${res.statusText}`);
        } catch (error: any) {
            console.log(`Porta ${port}: FALHA (${error.message})`);
        }
    }
}

testCommonPorts();
