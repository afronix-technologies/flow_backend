const { exec } = require('child_process');
const bcrypt = require('bcrypt');

const CONTAINER_NAME = 'afronix-tracker-postgres-1';
const DB_USER = process.env.DATABASE_USER || 'postgres';
const DB_NAME = process.env.DATABASE_NAME || 'afronix_tracker';
const PASSWORD = 'P@ssw0rd123';

function runQuery(query) {
    return new Promise((resolve, reject) => {
        const command = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -A -c "${query}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });
}

async function verify() {
    try {
        console.log('Fetching hash from DB...');
        const hash = await runQuery(`SELECT password FROM auth_users WHERE email = 'user@example.com'`);
        console.log('Stored Hash:', hash);

        console.log(`Comparing '${PASSWORD}' with hash...`);
        const match = await bcrypt.compare(PASSWORD, hash);

        if (match) {
            console.log('✅ MATCH! The password in DB is correct.');
        } else {
            console.log('❌ NO MATCH! The hash in DB is invalid for this password.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

verify();
