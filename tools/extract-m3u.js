// NOTFLİX — filmmodu.news katalogundan ana m3u8 (master playlist) çıkarıcı.
// Zincir: içerik sayfası -> data-pv -> s.php -> window.__PLAYER__.stream -> #EXTM3U.
// Çıktı: masaüstünde notflix-m3u/ altında URL yolunu aynen yansıtan .m3u dosyaları + manifest.jsonl.
// Kullanım: node extract-m3u.js [--limit N] [--conc 6] [--only film|dizi|anime] [--fresh]
const fs = require('fs');
const path = require('path');

const DESKTOP = path.join(require('os').homedir(), 'Desktop');
const OUT = path.join(DESKTOP, 'notflix-m3u');
const SMDIR = path.join(OUT, '_sitemaps');
const MANIFEST = path.join(OUT, 'manifest.jsonl');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const REF = 'https://filmmodu.news/';
const SITEMAPS = ['movies', 'episodes-1', 'episodes-2', 'anime'];

const args = process.argv.slice(2);
const argVal = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LIMIT = parseInt(argVal('--limit', '0'), 10) || 0;
const CONC = Math.max(1, parseInt(argVal('--conc', '6'), 10) || 6);
const ONLY = argVal('--only', '');
const FRESH = args.includes('--fresh');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SMDIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function get(url, referer, tries) {
  tries = tries || 3;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Referer': referer || REF, 'Accept': '*/*', 'Accept-Language': 'tr-TR,tr;q=0.9' },
        signal: ctrl.signal, redirect: 'follow'
      });
      clearTimeout(to);
      const text = await r.text();
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return text;
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(700 * (i + 1) + Math.random() * 400);
    }
  }
}

async function loadSitemaps() {
  const urls = [];
  for (const name of SITEMAPS) {
    const fp = path.join(SMDIR, 'sm-' + name + '.xml');
    let xml;
    if (!FRESH && fs.existsSync(fp)) xml = fs.readFileSync(fp, 'utf8');
    else { xml = await get('https://filmmodu.news/sitemap-' + name + '.xml', REF); fs.writeFileSync(fp, xml); }
    const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m => m[1].trim());
    let kept = 0;
    for (const u of locs) {
      let p; try { p = new URL(u).pathname; } catch (e) { continue; }
      if (!/^\/(film|dizi|anime)\//.test(p)) continue; // kategori/sabit sayfaları ele
      if (ONLY && !p.startsWith('/' + ONLY + '/')) continue;
      urls.push(u); kept++;
    }
    console.log('sitemap ' + name + ': ' + kept + ' içerik URL');
  }
  return [...new Set(urls)];
}

function outPath(url) {
  const p = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
  return path.join(OUT, p + '.m3u');
}
function extractPlayerBase(html) {
  const m = html.match(/https:\/\/[^"'\s]+?\/assets\/js\/core\.js/);
  if (m) return m[0].replace(/\/assets\/js\/core\.js.*$/, '');
  const m2 = html.match(/https:\/\/[^"'\s]+?\/e\/c\.js/);
  if (m2) return m2[0].replace(/\/e\/c\.js.*$/, '');
  return 'https://pilavyerplay.top';
}

async function processOne(url) {
  const file = outPath(url);
  if (!FRESH && fs.existsSync(file) && fs.statSync(file).size > 20) return { url, file, skip: true };
  const html = await get(url, REF);
  const pv = html.match(/data-pv="([^"]+)"/);
  if (!pv) return { url, ok: false, reason: 'no-player' };
  const base = extractPlayerBase(html);
  const sphp = await get(base + '/assets/js/s.php?s=' + encodeURIComponent(pv[1]), REF);
  const pm = sphp.match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\});<\/script>/);
  if (!pm) return { url, ok: false, reason: 'no-config' };
  let cfg; try { cfg = JSON.parse(pm[1]); } catch (e) { return { url, ok: false, reason: 'bad-config' }; }
  if (!cfg.stream) return { url, ok: false, reason: 'no-stream' };
  const m3u = await get(cfg.stream, REF);
  if (!m3u.includes('#EXTM3U')) return { url, ok: false, reason: 'not-m3u8' };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, m3u);
  return { url, ok: true, file, title: cfg.title || '', stream: cfg.stream, bytes: m3u.length };
}

(async () => {
  const urls = await loadSitemaps();
  const total = LIMIT ? Math.min(LIMIT, urls.length) : urls.length;
  const queue = urls.slice(0, total);
  console.log('TOPLAM işlenecek: ' + total + ' | eşzamanlı: ' + CONC + ' | çıktı: ' + OUT);
  const t0 = Date.now();
  let done = 0, ok = 0, skip = 0, fail = 0, idx = 0;
  const failures = [];
  const man = fs.createWriteStream(MANIFEST, { flags: 'a' });

  async function worker() {
    while (idx < queue.length) {
      const my = idx++;
      const url = queue[my];
      let res;
      try { res = await processOne(url); }
      catch (e) { res = { url, ok: false, reason: String((e && e.message) || e) }; }
      done++;
      if (res.skip) skip++;
      else if (res.ok) { ok++; man.write(JSON.stringify({ url: res.url, title: res.title, file: path.relative(OUT, res.file), stream: res.stream, bytes: res.bytes, ts: Date.now() }) + '\n'); }
      else { fail++; failures.push(res); man.write(JSON.stringify(res) + '\n'); }
      if (done % 50 === 0 || done === queue.length) {
        const rate = (done / ((Date.now() - t0) / 1000)).toFixed(1);
        console.log('[' + done + '/' + queue.length + '] ok=' + ok + ' skip=' + skip + ' fail=' + fail + ' | ' + rate + ' içerik/sn');
      }
      await sleep(120 + Math.random() * 180);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  man.end();
  fs.writeFileSync(path.join(OUT, 'failures.json'), JSON.stringify(failures, null, 2));
  console.log('BİTTİ. ok=' + ok + ' skip=' + skip + ' fail=' + fail + ' | süre=' + (((Date.now() - t0) / 1000) / 60).toFixed(1) + ' dk');
  console.log('Örnek ilk 5 başarılı:');
  // manifest'tan ilk birkaç ok kaydı göster
  const lines = fs.readFileSync(MANIFEST, 'utf8').trim().split('\n').slice(-400);
  let shown = 0;
  for (const l of lines) { try { const j = JSON.parse(l); if (j.ok && shown < 5) { console.log('  ' + j.title + ' -> ' + j.file); shown++; } } catch (e) {} }
})();