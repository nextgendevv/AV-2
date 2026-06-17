const https = require('https');

const options = {
  method: 'OPTIONS',
  hostname: 'av-2-ls9k.onrender.com',
  path: '/api/auth/register',
  headers: {
    Origin: 'https://av-2-1.onrender.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  res.on('data', () => {});
  res.on('end', () => process.exit(0));
});

req.on('error', (err) => {
  console.error('error:', err.message);
  process.exit(1);
});

req.end();