
const crypto = require('crypto');
const fs = require('fs');

const s1 = crypto.randomBytes(48).toString('base64');
const s2 = crypto.randomBytes(48).toString('base64');

fs.writeFileSync('secrets.txt', `JWT_SECRET=${s1}\nJWT_REFRESH_SECRET=${s2}`);
console.log('Secrets written to secrets.txt');
