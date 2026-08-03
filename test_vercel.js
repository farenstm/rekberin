const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const html = await get('https://rekberin-jade.vercel.app');
  const jsFiles = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  for (const js of jsFiles) {
    const url = js.startsWith('http') ? js : 'https://rekberin-jade.vercel.app' + (js.startsWith('/') ? '' : '/') + js;
    const content = await get(url);
    if (content.includes('45aB3cD2e1F40a5B6c7D8e9F0a1B2c3D4e5F6a78')) {
       console.log('FOUND MOCK WALLET IN:', js);
    }
  }
}
test();
