const { exec } = require('child_process');
const readline = require('readline');

// Container configuration
const CONTAINER_NAME = 'afronix-tracker-postgres-1';
const DB_USER = process.env.DATABASE_USER || 'postgres';
const DB_NAME = process.env.DATABASE_NAME || 'afronix_tracker';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function runQuery(query) {
    return new Promise((resolve, reject) => {
        // Escape the query for command line
        const escapedQuery = query.replace(/"/g, '\\"');
        const command = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "${escapedQuery}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                // If container not found or other docker error
                if (stderr.includes('No such container')) {
                    reject(new Error('Docker container not found. Is it running?'));
                    return;
                }
                reject(error);
                return;
            }
            if (stderr && !stderr.includes('NOTICE')) {
                // console.warn('Stderr:', stderr); // psql sometimes prints notices to stderr
            }
            resolve(stdout);
        });
    });
}

async function verifyUser(email) {
    try {
        console.log(`\nChecking user with email: ${email}...`);

        // Check if user exists
        // We use \x off and parsed output or just row count logic
        // Easier: SELECT count(*) ...
        const countOutput = await runQuery(`SELECT count(*) FROM auth_users WHERE email = '${email}'`);
        const count = parseInt(countOutput.match(/\d+/)[0], 10);

        if (count === 0) {
            console.log('❌ User not found.');
            return;
        }

        // Check verification status
        const statusOutput = await runQuery(`SELECT email_verified FROM auth_users WHERE email = '${email}'`);
        const isVerified = statusOutput.includes('t'); // 't' for true in psql output

        if (isVerified) {
            console.log('ℹ️  User is already verified.');
            return;
        }

        // Verify user
        console.log('Verifying user...');
        await runQuery(`UPDATE auth_users SET email_verified = true, email_verification_token = null WHERE email = '${email}'`);
        console.log('✅ User verified successfully!');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

// Check for command line argument
const emailArg = process.argv[2];

if (emailArg) {
    verifyUser(emailArg).then(() => {
        rl.close();
        process.exit(0);
    });
} else {
    rl.question('Enter email to verify: ', (email) => {
        verifyUser(email.trim()).then(() => {
            rl.close();
            process.exit(0);
        });
    });
}
