import { db } from './index';
import { knowledgeUnits } from './schema';
import { getEmbedding } from '../utils/embeddings';
import { isNull, eq } from 'drizzle-orm';

async function syncEmbeddings() {
    console.log('Iniciando sincronização de embeddings...');

    try {
        const units = await db.select().from(knowledgeUnits).where(isNull(knowledgeUnits.embedding));

        console.log(`Encontradas ${units.length} unidades sem embedding.`);

        for (const unit of units) {
            console.log(`Gerando embedding para: ${unit.title}...`);

            const contentToEmbed = `Título: ${unit.title}\nPergunta: ${unit.problemDescription}\nResposta: ${unit.officialResolution}`;

            try {
                const embedding = await getEmbedding(contentToEmbed);
                console.log(`Embedding gerado. Salvando no DB...`);

                await db.update(knowledgeUnits)
                    .set({ embedding })
                    .where(eq(knowledgeUnits.id, unit.id));

                console.log(`✅ Sucesso: ${unit.title}`);
            } catch (err: any) {
                console.error(`❌ Erro ao processar [${unit.title}]:`);
                console.error(err);
            }
        }

        console.log('Sincronização concluída!');
    } catch (err) {
        console.error('Erro geral na sincronização:', err);
    }
}

syncEmbeddings();
