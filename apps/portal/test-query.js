const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { pgTable, text, timestamp, uuid } = require("drizzle-orm/pg-core");

const admins = pgTable('admins', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

const pool = new Pool({
    connectionString: "postgres://postgres:Dev@Empregga2025@5.161.87.6:5433/empregga_kb",
});

const db = drizzle(pool);

async function test() {
    try {
        const { eq } = require('drizzle-orm');
        const result = await db.select().from(admins).where(eq(admins.email, "raphael.budin@empregga.com.br")).limit(1);
        console.log("SUCCESS:", result);
    } catch (e) {
        console.error("FAILED:", e.message);
    } finally {
        pool.end();
    }
}
test();