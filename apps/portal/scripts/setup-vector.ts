import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function setupVector() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Conectado à VPS...');

        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('Extensão pgvector habilitada com sucesso!');

    } catch (err) {
        console.error('Erro ao habilitar pgvector:', err);
    } finally {
        await client.end();
    }
}

setupVector();
