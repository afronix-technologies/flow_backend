const { Client } = require('pg');

// Hardcoded config matching the defaults we believe we use
const config = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'afronix_tracker',
    password: '432Iya_2017',
    port: 5432,
};

async function inspect() {
    console.log('Connecting with:', config);
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Connected.');

        await client.query(`
            INSERT INTO auth_users (id, email, "firstName", "lastName", password, "organizationId", "roleId", "email_verified")
            VALUES ('11111111-1111-1111-1111-111111111111', 'ghost@example.com', 'Ghost', 'User', 'pass', 
            (SELECT id FROM organizations LIMIT 1), (SELECT id FROM auth_roles LIMIT 1), true)
            ON CONFLICT DO NOTHING
        `);
        console.log('Inserted ghost user.');

        const res = await client.query('SELECT * FROM auth_users');
        console.log(`Found ${res.rowCount} users:`);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

inspect();
