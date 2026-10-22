// Prévia estática local do bundle incluído. Nenhum dado é enviado a um servidor externo.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../apps/web/dist/browser');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Bundle não encontrado. Execute npm run build -w @wealthos/finance e npm run build -w @wealthos/web.');
  process.exit(1);
}
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.json':'application/json' };
const server = http.createServer((req,res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405);res.end();return;}
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (requested.startsWith('/api')) {res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'Na prévia estática, configure a API como http://localhost:3000/api ou utilize npm run dev:web.'}));return;}
    const filename = path.resolve(root, '.' + (requested==='/'?'/index.html':requested));
    if (!filename.startsWith(root+path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {res.writeHead(404);res.end('Não encontrado.');return;}
    res.writeHead(200, {'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if (req.method==='HEAD') res.end(); else fs.createReadStream(filename).pipe(res);
  } catch {res.writeHead(400);res.end('Requisição inválida.');}
});
server.on('error', error => { console.error(error.code==='EADDRINUSE'?'A porta 4200 já está em uso. Encerre a outra prévia.':'Não foi possível iniciar a prévia local.');process.exitCode=1; });
server.listen(4200,'127.0.0.1',()=>console.log('WealthOS: abra http://localhost:4200. Ctrl+C para encerrar.'));
