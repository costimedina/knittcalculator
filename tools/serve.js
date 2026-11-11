// Servidor local para revisar la página: envuelve index.html en el esqueleto
// que agrega el visor de artifacts y sirve lib/ y ui/ tal cual.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const raiz = new URL("..", import.meta.url).pathname;
const tipos = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json" };

const esqueleto = (cuerpo) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>${cuerpo}</body></html>`;

createServer(async (req, res) => {
  try {
    const ruta = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const contenido = await readFile(join(raiz, ruta));
    const tipo = tipos[extname(ruta)] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": tipo });
    res.end(ruta === "/index.html" ? esqueleto(contenido.toString()) : contenido);
  } catch {
    res.writeHead(404); res.end("no existe");
  }
}).listen(Number(process.env.PORT ?? 8099), () => console.log("listo"));
