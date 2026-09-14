// Only serves the family chapter's public assets, never repository/private files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = new Set(['family.html','family.css','family-game.js','family-art.js','family.js']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function createServer() {
  return http.createServer((req,res)=>{
    let name;
    try {name=new URL(req.url,'http://localhost').pathname.slice(1);} catch {res.writeHead(400);res.end();return;}
    if(name===''||name==='index.html')name='family.html';
    if(!['GET','HEAD'].includes(req.method)||!files.has(name)){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(path.join(__dirname,'..',name)).pipe(res);
  });
}
if(require.main===module){const port=Number(process.env.PORT)||4173;const host=process.env.HOST||'127.0.0.1';createServer().listen(port,host,()=>console.log(`Family chapter: http://${host}:${port}/family.html`));}
module.exports={createServer};
