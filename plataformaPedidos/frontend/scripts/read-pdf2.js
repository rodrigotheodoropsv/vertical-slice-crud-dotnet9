const fs = require('fs');
const path = require('path');

// Try pdf-parse if available, otherwise do manual extraction
try {
  const pdfParse = require('pdf-parse');
  const buf = fs.readFileSync(path.join(__dirname, '../public/pedido_modelo.pdf'));
  pdfParse(buf).then(data => {
    console.log('=== PDF TEXT ===');
    console.log(data.text);
  });
} catch(e) {
  console.log('pdf-parse not available, trying manual extraction...');
  // Manual: decode flate streams and extract text
  const buf = fs.readFileSync(path.join(__dirname, '../public/pedido_modelo.pdf'));
  const str = buf.toString('binary');
  // Find all text between BT and ET markers (PDF text blocks)
  const blocks = [];
  let pos = 0;
  while (pos < str.length) {
    const bt = str.indexOf('BT', pos);
    if (bt < 0) break;
    const et = str.indexOf('ET', bt);
    if (et < 0) break;
    blocks.push(str.slice(bt, et + 2));
    pos = et + 2;
  }
  const texts = [];
  for (const block of blocks) {
    const matches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
    for (const m of matches) {
      const t = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
      if (t) texts.push(t);
    }
    // Also TJ arrays
    const tjMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
    for (const m of tjMatches) {
      const parts = m.match(/\(([^)]*)\)/g) || [];
      const t = parts.map(p => p.slice(1, -1)).join('').trim();
      if (t) texts.push(t);
    }
  }
  console.log(texts.join('\n'));
}
