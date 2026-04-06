import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { inflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, '../public/pedido_modelo.pdf'));

// Find and decompress all FlateDecode streams
const results = [];
let pos = 0;
while (pos < buf.length - 10) {
  // Find "stream\r\n" or "stream\n"
  const streamTag = buf.indexOf('stream', pos);
  if (streamTag < 0) break;

  // Read the header before this stream to check for FlateDecode
  const headerStart = Math.max(0, streamTag - 400);
  const header = buf.slice(headerStart, streamTag).toString('ascii');
  if (!header.includes('FlateDecode') && !header.includes('Flate')) {
    pos = streamTag + 6;
    continue;
  }

  // Skip past 'stream\r\n' or 'stream\n'
  let dataStart = streamTag + 6;
  if (buf[dataStart] === 0x0d) dataStart++;
  if (buf[dataStart] === 0x0a) dataStart++;

  // Find endstream
  const endStream = buf.indexOf('endstream', dataStart);
  if (endStream < 0) break;

  const compressed = buf.slice(dataStart, endStream);
  try {
    const decompressed = inflateSync(compressed).toString('latin1');
    // Extract text from decompressed stream
    const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let m;
    while ((m = tjRe.exec(decompressed)) !== null) {
      const t = m[1].replace(/\\n/g,' ').replace(/\\\\/g,'\\').replace(/\\(.)/g,'$1').trim();
      if (t.length > 0) results.push(t);
    }
    const tjArr = /\[([^\]]*)\]\s*TJ/g;
    while ((m = tjArr.exec(decompressed)) !== null) {
      const parts = [];
      const pr = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let pm;
      while ((pm = pr.exec(m[1])) !== null) parts.push(pm[1].replace(/\\(.)/g,'$1'));
      const t = parts.join('').trim();
      if (t.length > 0) results.push(t);
    }
  } catch {}
  pos = endStream + 9;
}

console.log(results.join('\n'));
