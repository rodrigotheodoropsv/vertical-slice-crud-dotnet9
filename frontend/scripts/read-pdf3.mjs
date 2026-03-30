import { readFileSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, '../public/pedido_modelo.pdf'));
const str = buf.toString('latin1');

// Extract raw text strings from PDF Tj/TJ operators (no compression needed for simple PDFs)
const results = [];

// Match (text) Tj  - single string show
const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
let m;
while ((m = tjRe.exec(str)) !== null) {
  const t = m[1].replace(/\\n/g,' ').replace(/\\r/g,' ').replace(/\\\\/g,'\\').replace(/\\(.)/g,'$1').trim();
  if (t.length > 0) results.push(t);
}

// Match [(text) ...] TJ - array text show
const tjArrayRe = /\[([^\]]*)\]\s*TJ/g;
while ((m = tjArrayRe.exec(str)) !== null) {
  const inner = m[1];
  const parts = [];
  const partRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
  let pm;
  while ((pm = partRe.exec(inner)) !== null) {
    parts.push(pm[1].replace(/\\(.)/g,'$1'));
  }
  const t = parts.join('').trim();
  if (t.length > 0) results.push(t);
}

console.log(results.join('\n'));
