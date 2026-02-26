const { Client } = require("pg");
const connectionString = "postgres://postgres:Dev@Empregga2025@5.161.87.6:5433/empregga_kb";
const client = new Client({ connectionString });
client.connect().then(() => {
    console.log("CONNECTED");
    client.end();
}).catch(e => {
    console.error("ERROR:", e.message);
    process.exit(1);
});