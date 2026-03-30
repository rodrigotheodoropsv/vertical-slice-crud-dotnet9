const fs = require('fs');
const buf = fs.readFileSync(
  'C:/Users/Rodrigo/Desktop/Rodrigo/Estudos/Contrato/vertical-slice-crud-dotnet9/frontend/public/pedido_modelo.pdf',
  'latin1'
);

// Extract all parenthesised strings (PDF text objects)
const results = [];
let i = 0;
while (i < buf.length) {
  if (buf[i] === '(') {
    let s = '';
    i++;
    while (i < buf.length && buf[i] !== ')') {
      if (buf[i] === '\\') { i++; } // skip escape
      s += buf[i];
      i++;
    }
    const t = s.trim();
    if (t.length > 1) results.push(t);
  }
  i++;
}
console.log(results.slice(0, 300).join('\n'));
