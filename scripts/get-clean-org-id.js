const { exec } = require('child_process');

const CONTAINER_NAME = 'afronix-tracker-postgres-1';
const DB_USER = process.env.DATABASE_USER || 'postgres';
const DB_NAME = process.env.DATABASE_NAME || 'afronix_tracker';

function runQuery(query) {
    return new Promise((resolve, reject) => {
        const command = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -A -c "${query}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });
}

const fs = require('fs');

async function getOrgId() {
    try {
        const orgId = await runQuery(`SELECT organization_id FROM auth_users WHERE email = 'user@example.com' LIMIT 1`);
        console.log(`Writing Org ID to org_id.txt...`);
        fs.writeFileSync('org_id.txt', orgId.trim());
    } catch (err) {
        console.error('Error:', err);
    }
}

getOrgId();
