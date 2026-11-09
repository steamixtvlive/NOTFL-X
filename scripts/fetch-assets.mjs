import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(root, '..', 'vuma_probe');
const css = path.join(root, 'assets', 'css');
const img = path.join(root, 'assets', 'img');
fs.mkdirSync(css, { recursive: true });
fs.mkdirSync(img, { recursive: true });

fs.copyFileSync(path.join(src, 'fm.css'), path.join(css, 'filmmodu.raw.css'));
const content = JSON.parse(fs.readFileSync(path.join(src, 'home_content.json'), 'utf8'));

const urls = new Set([content.hero.backdrop]);
for (const rail of content.rails) for (const card of rail.cards) urls.add(card.img);

let ok = 0;
for (const url of urls) {
  const name = url.split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = path.join(img, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) { ok++; continue; }
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.log('basarisiz', res.status, url); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) { console.log('govde cok kucuk', url); continue; }
  fs.writeFileSync(dest, buf);
  ok++;
}

for (const key of ['backdrop']) if (content.hero[key]) content.hero[key] = 'assets/img/' + content.hero[key].split('/').pop();
for (const rail of content.rails) for (const card of rail.cards) card.img = 'assets/img/' + card.img.split('/').pop();
fs.writeFileSync(path.join(root, 'assets', 'content.json'), JSON.stringify(content, null, 1));

console.log('css kopyalandi, gorsel indirildi:', ok, '/', urls.size);
