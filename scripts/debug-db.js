const { Client } = require('pg');
const fs = require('fs');

const config = {
    user: process.env.DATABASE_USER || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    database: process.env.DATABASE_NAME || 'afronix_tracker',
    password: process.env.DATABASE_PASSWORD || '432Iya_2017',
    port: process.env.DATABASE_PORT || 5432,
};

async function debugDB() {
    const client = new Client(config);
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    try {
        await client.connect();
        log('✅ Connected to database');

        // List ALL tables in ALL schemas
        const tablesRes = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name
        `);
        log('\n--- ALL TABLES ---');
        tablesRes.rows.forEach(r => log(`${r.table_schema}.${r.table_name}`));

    } catch (err) {
        log('Error: ' + err.stack);
    } finally {
        await client.end();
        fs.writeFileSync('debug-output.txt', output);
    }
}

debugDB();
