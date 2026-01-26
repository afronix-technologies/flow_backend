const { exec } = require('child_process');

const CONTAINER_NAME = 'afronix-tracker-postgres-1';
const DB_USER = process.env.DATABASE_USER || 'postgres';
const DB_NAME = process.env.DATABASE_NAME || 'afronix_tracker';

async function cleanup() {
    // Keep the one with the Org ID the user is trying to use?
    // User is using: 1b516a72-137c-4c90-945e-23b71d215134
    // Let's delete everyone NOT matching that Org ID first.
    // THEN if duplicates still exist, keep latest.

    const targetOrgId = '1b516a72-137c-4c90-945e-23b71d215134';

    // 1. Delete mismatching Orgs
    const cmd1 = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "DELETE FROM auth_users WHERE email = 'user@example.com' AND organization_id != '${targetOrgId}';"`;

    exec(cmd1, (err, stdout) => {
        console.log('Deleted mismatched org users:', stdout);

        // 2. Keep only LATEST of the remaining
        const cmd2 = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "DELETE FROM auth_users WHERE id IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rnum FROM auth_users WHERE email = 'user@example.com') t WHERE t.rnum > 1);"`;

        exec(cmd2, (err2, stdout2) => {
            console.log('Deleted duplicate rows:', stdout2);
            console.log('Cleanup complete.');
        });
    });
}

cleanup();
