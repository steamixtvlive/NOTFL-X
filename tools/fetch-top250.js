// IMDB Top 250 -> assets/top250.json. Kaynak: 6 saatte bir güncellenen açık JSON (theapache64/top250).
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'top250.json');
const SRC = 'https://raw.githubusercontent.com/theapache64/top250/master/top250_min.json';

async function main() {
  const r = await fetch(SRC, { headers: { 'User-Agent': 'NOTFLIX-Catalog' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const arr = await r.json();
  if (!Array.isArray(arr) || arr.length < 200) throw new Error('beklenmeyen veri');
  const items = arr.map((m, i) => ({
    rank: i + 1,
    id: (String(m.imdb_url || '').match(/tt\d+/) || [''])[0],
    title: m.name || '',
    year: m.year || '',
    rating: m.rating || '',
    genres: m.genre || [],
    img: m.image_url || m.thumb_url || '',
    desc: m.desc || ''
  }));
  fs.writeFileSync(OUT, JSON.stringify({ ts: Date.now(), items }));
  console.log('YAZILDI:', OUT, '|', items.length, 'film');
}
main().catch(e => { console.error(e.message || e); process.exit(1); });