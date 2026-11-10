// Yerel site kilidi: filmmodu arayüzü kabuğun kendi sunucusundan geçer ve her başarılı
// yanıt userData/site-cache içine yazılır. Kaynak site kapanırsa aynı arayüz yerel
// kopyadan aynen sunulmaya devam eder — iframe bizde kalır.
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const UPSTREAM = 'https://filmmodu.news';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TEXT = /html|css|javascript|json|xml|text/i;
const MAX_BODY = 8 * 1048576;
const MAX_FILES = 700;

function createSiteProxy(cacheDir, upstream) {
  const BASE = upstream || UPSTREAM;
  fs.mkdirSync(cacheDir, { recursive: true });
  const keyOf = rest => crypto.createHash('sha1').update(rest).digest('hex');
  const metaPath = k => path.join(cacheDir, k + '.json');
  const bodyPath = k => path.join(cacheDir, k + '.bin');

  function readCache(rest) {
    try {
      const k = keyOf(rest);
      const meta = JSON.parse(fs.readFileSync(metaPath(k), 'utf8'));
      return { meta, body: fs.readFileSync(bodyPath(k)) };
    } catch (e) { return null; }
  }
  function evict() {
    try {
      const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
      if (files.length <= MAX_FILES) return;
      const aged = files.map(f => ({ f, t: fs.statSync(path.join(cacheDir, f)).mtimeMs })).sort((a, b) => a.t - b.t);
      aged.slice(0, files.length - MAX_FILES).forEach(({ f }) => {
        const k = f.slice(0, -5);
        try { fs.unlinkSync(path.join(cacheDir, f)); fs.unlinkSync(bodyPath(k)); } catch (e) {}
      });
    } catch (e) {}
  }
  function writeCache(rest, ctype, body) {
    try {
      if (body.length > MAX_BODY) return;
      const k = keyOf(rest);
      fs.writeFileSync(bodyPath(k), body);
      fs.writeFileSync(metaPath(k), JSON.stringify({ ctype, ts: Date.now() }));
      if (Math.random() < 0.05) evict();
    } catch (e) {}
  }
  // Mutlak site adreslerini yerel sunuma çevir: arayüzün tüm istekleri bizden geçer.
  // Kök-göreli href/src (/takvim gibi) de kilidin içinde kalsın diye /site/ öneki alır.
  function rewrite(buf, ctype) {
    if (!TEXT.test(ctype)) return buf;
    let s = buf.toString('utf8')
      .replace(/https?:\/\/(www\.)?filmmodu\.news/g, '/site')
      .replace(/\/\/(www\.)?filmmodu\.news/g, '/site');
    if (/html/i.test(ctype)) {
      s = s
        .replace(/(\s(?:href|src|action|poster|data-src)=["'])\/(?!\/|site)/g, '$1/site/')
        .replace(/(\ssrcset=["'])([^"']*)/g, (m, p, v) => p + v.replace(/(^|,\s*)\/(?!\/|site)/g, '$1/site/'));
    }
    s = s.replace(/url\(\s*(['"]?)\/(?!\/|site)/g, 'url($1/site/');
    return Buffer.from(s, 'utf8');
  }
  function fetchUpstream(rest, redirects) {
    return new Promise((resolve, reject) => {
      if (redirects > 5) return reject(new Error('cok yonlendirme'));
      let req;
      try {
        req = https.get(BASE + rest, { headers: { 'User-Agent': UA, Accept: '*/*', Referer: BASE + '/' } }, res => {
          const code = res.statusCode || 0;
          if ([301, 302, 303, 307, 308].includes(code)) {
            const loc = res.headers.location;
            res.resume();
            if (!loc) return reject(new Error('yonlendirme adresi yok'));
            let u;
            try { u = new URL(loc, BASE + rest); } catch (e) { return reject(e); }
            if (u.hostname !== new URL(BASE).hostname) return reject(new Error('site disi yonlendirme'));
            return resolve(fetchUpstream(u.pathname + u.search, redirects + 1));
          }
          if (code !== 200) { res.resume(); return reject(new Error('HTTP ' + code)); }
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve({ ctype: res.headers['content-type'] || 'application/octet-stream', body: Buffer.concat(chunks) }));
          res.on('error', reject);
        });
      } catch (e) { return reject(e); }
      req.on('error', reject);
      req.setTimeout(9000, () => req.destroy(new Error('zaman asimi')));
    });
  }
  function serve(res, ctype, body) {
    res.writeHead(200, { 'Content-Type': ctype, 'Cache-Control': 'no-store' });
    res.end(body);
  }
  async function handle(req, res, rest) {
    if (!rest || rest === '') rest = '/';
    try {
      const up = await fetchUpstream(rest, 0);
      const body = rewrite(up.body, up.ctype);
      writeCache(rest, up.ctype, body);
      serve(res, up.ctype, body);
    } catch (e) {
      const cached = readCache(rest);
      if (cached) return serve(res, cached.meta.ctype, cached.body);
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0a0a0a;color:#fff;font-family:Segoe UI,Arial,sans-serif;display:grid;place-items:center;height:100vh"><div style="text-align:center"><div style="color:#e50914;font-size:34px;font-weight:800;letter-spacing:.02em">NOTFLİX</div><p style="color:#b6bcc6">Bağlantı kurulamadı; yerel kopya bu adres için henüz oluşmadı.</p></div>');
    }
  }
  return { handle, cacheDir };
}

module.exports = { createSiteProxy };