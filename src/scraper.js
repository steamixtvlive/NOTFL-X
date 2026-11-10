// NOTFLİX arka plan scraper'ı: VOD tokenlerini sessizce tazeler, IMDB Top 250'yi haftalık yeniler.
// Kullanıcı arayüzüne hiçbir şey sızmaz; oynatma anında stream:resolve her zaman taze adres verir.
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const REF = 'https://filmmodu.news/';
const TOP250_SRC = 'https://raw.githubusercontent.com/theapache64/top250/master/top250_min.json';
const TOKEN_TTL = 6 * 24 * 3600 * 1000; // 6 günden eski tokenler süpürülür (token ömrü ~1 hafta)
const RESOLVE_TTL = 6 * 3600 * 1000;    // oynatma anı çözümlemesi 6 saat bellekte tutulur
const SWEEP_EVERY = 24 * 3600 * 1000;
const TOP250_EVERY = 7 * 24 * 3600 * 1000;

let ROOT = '', USER = '';
let getWin = () => null;
const resolveCache = new Map();

async function get(url, referer) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9', ...(referer ? { Referer: referer } : {}) },
    signal: AbortSignal.timeout(25000)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

// Kanıtlanmış zincir: içerik sayfası -> data-pv -> s.php -> __PLAYER__.stream
async function resolveStream(pageUrl) {
  const cached = resolveCache.get(pageUrl);
  if (cached && Date.now() - cached.ts < RESOLVE_TTL) return { ok: true, url: cached.url, title: cached.title, cached: true };
  const html = await get(pageUrl, REF);
  const pv = html.match(/data-pv="([^"]+)"/);
  if (!pv) return { ok: false, error: 'no-player' };
  const baseM = html.match(/src="(https:\/\/[^"]+)\/(?:assets\/js\/core|e\/c)\.js/);
  const base = baseM ? baseM[1] : 'https://pilavyerplay.top';
  const sp = await get(base + '/assets/js/s.php?s=' + encodeURIComponent(pv[1]), REF);
  const cfgM = sp.match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\});<\/script>/);
  if (!cfgM) return { ok: false, error: 'no-config' };
  let cfg; try { cfg = JSON.parse(cfgM[1]); } catch (e) { return { ok: false, error: 'bad-config' }; }
  if (!cfg.stream) return { ok: false, error: 'no-stream' };
  resolveCache.set(pageUrl, { url: cfg.stream, title: cfg.title || '', ts: Date.now() });
  return { ok: true, url: cfg.stream, title: cfg.title || '' };
}

function catalogPath() {
  const u = path.join(USER, 'vod.json');
  return fs.existsSync(u) ? u : path.join(ROOT, 'assets', 'vod.json');
}
function readCatalog() {
  try { return JSON.parse(fs.readFileSync(catalogPath(), 'utf8')); } catch (e) { return null; }
}
function writeUserCatalog(cat) {
  const tmp = path.join(USER, 'vod.json.tmp');
  fs.writeFileSync(tmp, JSON.stringify(cat));
  fs.renameSync(tmp, path.join(USER, 'vod.json'));
}

async function sweepTokens() {
  const cat = readCatalog();
  if (!cat) return;
  const now = Date.now();
  const stale = [];
  for (const f of cat.films || []) if (f.page && now - (f.ts || 0) > TOKEN_TTL) stale.push(f);
  for (const s of cat.series || []) for (const eps of Object.values(s.seasons || {})) for (const e of eps) if (e.page && now - (e.ts || 0) > TOKEN_TTL) stale.push(e);
  if (!stale.length) { console.log('SCRAPER: tokenler taze, süpürme gerek yok'); return; }
  console.log('SCRAPER:', stale.length, 'içerik tazeleniyor…');
  let ok = 0, fail = 0, i = 0;
  async function worker() {
    while (i < stale.length) {
      const item = stale[i++];
      try {
        const r = await resolveStream(item.page);
        if (r.ok) { item.url = r.url; item.ts = now; ok++; } else fail++;
      } catch (e) { fail++; }
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
    }
  }
  await Promise.all([worker(), worker()]);
  cat.meta = cat.meta || {};
  cat.meta.lastSweep = new Date().toISOString();
  try {
    writeUserCatalog(cat);
    console.log('SCRAPER: tazeleme bitti ok=' + ok + ' fail=' + fail);
    const w = getWin();
    if (w && !w.isDestroyed()) w.webContents.send('catalog:updated', { ok, fail });
  } catch (e) { console.log('SCRAPER yazma hatası:', e.message); }
}

async function refreshTop250() {
  try {
    const r = await fetch(TOP250_SRC, { headers: { 'User-Agent': 'NOTFLIX-Catalog' }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length < 200) throw new Error('beklenmeyen veri');
    const items = arr.map((m, i) => ({
      rank: i + 1,
      id: (String(m.imdb_url || '').match(/tt\d+/) || [''])[0],
      title: m.name || '', year: m.year || '', rating: m.rating || '',
      genres: m.genre || [], img: m.image_url || m.thumb_url || '', desc: m.desc || ''
    }));
    fs.writeFileSync(path.join(USER, 'top250.json'), JSON.stringify({ ts: Date.now(), items }));
    console.log('SCRAPER: Top 250 yenilendi');
  } catch (e) { console.log('SCRAPER top250:', e.message || e); }
}

function top250Path() {
  const u = path.join(USER, 'top250.json');
  return fs.existsSync(u) ? u : path.join(ROOT, 'assets', 'top250.json');
}

function init(root, userData, winGetter) {
  ROOT = root; USER = userData; getWin = winGetter || (() => null);
  ipcMain.handle('stream:resolve', async (_e, pageUrl) => {
    try {
      if (!/^https:\/\/filmmodu\.news\/(film|dizi|anime)\//.test(String(pageUrl || ''))) return { ok: false, error: 'bad-url' };
      return await resolveStream(String(pageUrl));
    } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  });
  ipcMain.handle('data:top250', async () => {
    try { return { ok: true, data: JSON.parse(fs.readFileSync(top250Path(), 'utf8')) }; }
    catch (e) { return { ok: false }; }
  });
  // Açılıştan 60 sn sonra ilk süpürme; sonra 24 saatte bir. Top 250 haftalık.
  setTimeout(() => { sweepTokens().catch(() => {}); }, 60000);
  setInterval(() => { sweepTokens().catch(() => {}); }, SWEEP_EVERY);
  setTimeout(() => { refreshTop250(); }, 90000);
  setInterval(refreshTop250, TOP250_EVERY);
}

module.exports = { init, resolveStream };