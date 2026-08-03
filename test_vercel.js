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
  console.log('Found JS files:', jsFiles);
  for (const js of jsFiles) {
    const url = js.startsWith('http') ? js : 'https://rekberin-jade.vercel.app' + (js.startsWith('/') ? '' : '/') + js;
    const content = await get(url);
    if (content.includes('A6032Ce75eE62201173Ff5C48cf9563F6cd6A4a5')) {
       console.log('FOUND NEW ADDRESS IN:', js);
    }
    if (content.includes('e31BE7F102BEbe58f64FA01fd7aF1f8065c8efde')) {
       console.log('FOUND OLD ADDRESS IN:', js);
    }
  }
}
test();
