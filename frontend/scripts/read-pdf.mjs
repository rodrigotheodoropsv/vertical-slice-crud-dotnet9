import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, '../public/pedido_modelo.pdf'));
const data = await pdfParse(buf);
console.log(data.text);
