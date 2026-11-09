import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'assets', 'css');
const raw = fs.readFileSync(path.join(cssDir, 'filmmodu.raw.css'), 'utf8');

const swap = [
  [/\be50914/g, '12d9a0'],
  [/229 9 20/g, '18 217 160'],
  [/\bf40612\b/g, '34e8b6'],
  [/\bdc2626\b/g, '0fb384'],
  [/220 38 38/g, '15 179 132'],
  [/\be5091466\b/g, '12d9a066'],
  [/\b0a0a0a\b/g, '070b0d'],
  [/\b141414\b/g, '0f1518'],
  [/\b1a1a1a\b/g, '161d21'],
  [/\b161616 25%, #242424/g, '111a1e 25%, #1a252b'],
];

let out = raw;
let hits = 0;
for (const [re, to] of swap) {
  const before = out;
  out = out.replace(re, to);
  if (before !== out) hits += (before.match(re) || []).length;
}

fs.writeFileSync(path.join(cssDir, 'filmmodu.notflix.css'), out);
console.log('tema dosyası üretildi —', hits, 'renk noktası değiştirildi, boyut', (out.length / 1024).toFixed(0), 'KB');
