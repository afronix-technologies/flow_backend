const http = require('http');

const postData = JSON.stringify({
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'Password123!',
    organizationName: 'Test Org'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('Attempting to register user...');
console.log(`URL: http://${options.hostname}:${options.port}${options.path}`);
console.log('Payload:', postData);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let responseBody = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        responseBody += chunk;
    });
    res.on('end', () => {
        console.log('BODY:', responseBody);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
