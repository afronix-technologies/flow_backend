const { exec } = require('child_process');
const bcrypt = require('bcrypt'); // We need bcrypt to hash the password

const CONTAINER_NAME = 'afronix-tracker-postgres-1';
const DB_USER = process.env.DATABASE_USER || 'postgres';
const DB_NAME = process.env.DATABASE_NAME || 'afronix_tracker';
const NEW_PASS = 'P@ssw0rd123';

async function main() {
    try {
        const hash = await bcrypt.hash(NEW_PASS, 10);
        console.log(`Generated Hash for '${NEW_PASS}': ${hash}`);

        const query = `UPDATE auth_users SET password = '${hash}' WHERE email = 'user@example.com'`;
        const command = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "${query}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error updating DB:', error);
                return;
            }
            console.log('DB Output:', stdout);
            console.log('✅ Password updated successfully!');
        });

    } catch (e) {
        console.error('Error hashing:', e);
    }
}

main();
