import { db } from './index';
import { knowledgeUnits } from './schema';
import { isNotNull } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSync() {
    const units = await db.select().from(knowledgeUnits).where(isNotNull(knowledgeUnits.embedding));
    console.log(`Unidades com embedding: ${units.length}`);
}

checkSync();
