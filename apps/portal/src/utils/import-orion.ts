import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { knowledgeUnits } from '../db/schema';
import { getEmbedding } from './embeddings';
import { v4 as uuidv4 } from 'uuid';

// Exemplo da Estrutura Esperada no JSON
interface OrionUnit {
    categoria: string;
    autor: string;
    titulo_do_conhecimento: string;
    pergunta_ou_chamado_original: string;
    resolucao_padronizada: string;
    tags_semanticas?: string[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function importKnowledgeBase() {
    console.log('--- Iniciando Importação em Lote do Orion ---');

    const filePath = path.join(process.cwd(), 'base_eva_fixed.json');
    if (!fs.existsSync(filePath)) {
        console.error('ERRO: Arquivo base_eva_fixed.json não encontrado na raiz (/apps/portal).');
        console.log('Instruções: Crie um arquivo orion-data.json com um array de objetos ({ title, category, problemDescription, officialResolution }) e rode novamente.');
        process.exit(1);
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    let data: OrionUnit[] = [];
    try {
        data = JSON.parse(rawData);
    } catch (e) {
        console.error('ERRO: base_eva_fixed.json não é um JSON válido.');
        process.exit(1);
    }

    console.log(`Encontradas ${data.length} Unidades de Conhecimento para importação.`);

    let successCount = 0;
    let errorCount = 0;

    for (const [index, unit] of data.entries()) {
        try {
            console.log(`[${index + 1}/${data.length}] Processando: ${unit.titulo_do_conhecimento}...`);

            // Texto para gerar Embedding: O mesmo critério da Ingestão Manual
            const textToEmbed = `Problema: ${unit.titulo_do_conhecimento} - ${unit.pergunta_ou_chamado_original}. Solução: ${unit.resolucao_padronizada}`;

            // Gerando Vetorização na OpenAI
            const embedding = await getEmbedding(textToEmbed);

            // Inserindo no Postgres Database
            await db.insert(knowledgeUnits).values({
                title: unit.titulo_do_conhecimento,
                category: unit.categoria as any, // Assumindo enumeração correta. Evite restrições quebrando.
                problemDescription: unit.pergunta_ou_chamado_original,
                officialResolution: unit.resolucao_padronizada,
                tags: unit.tags_semanticas || [],
                status: 'PUBLISHED',
                author: unit.autor || 'Orion Importer (Batch)',
                embedding: embedding,
            });

            console.log(`  -> Sucesso!`);
            successCount++;

            // Rate Limiting para a OpenAI (Delay 1 segundo a cada item)
            // Impede tomar erro 429 Too Many Requests com arquivos de 67 páginas.
            await sleep(1000);

        } catch (error: any) {
            console.error(`  -> ERRO ao importar "${unit.titulo_do_conhecimento}":`, error.message);
            errorCount++;
        }
    }

    console.log('--- Importação Concluída ---');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    process.exit(0);
}

importKnowledgeBase();
