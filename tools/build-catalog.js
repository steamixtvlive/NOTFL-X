// notflix-m3u/manifest.jsonl -> assets/vod.json (renderer'ın VOD şekli) + TMDB zenginleştirme.
// Önbellekli ve yeniden çalıştırılabilir: aynı başlık bir daha aranmaz.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = 'C:\\Users\\sehab\\Desktop\\notflix-m3u\\manifest.jsonl';
const OUT = path.join(ROOT, 'assets', 'vod.json');
const CACHE = path.join(ROOT, 'assets', '.tmdb-cache.json');
const KEY = '21e3ff1da3bd38d1f167560193503c34';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const REF = 'https://filmmodu.news/';
const IMG = (p, s) => p ? `https://image.tmdb.org/t/p/${s || 'w500'}${p}` : '';
const CONC = 8;

const QUALITY = /^(1080p|720p|2160p|480p|4k|uhd|webrip|web-dl|web|bluray|blu-ray|bdrip|brrip|hdrip|dvdrip|x264|x265|h264|h265|hevc|aac|ac3|dts| dual|dual|eng|tr|turkce|türkçe|altyaz[ıi]|dublaj|filmbol|hdr|hdr10|repack|proper|complete|internal|extended|remastered|multi|dual audio)$/i;
function cleanFilmTitle(raw) {
  let t = String(raw || '').trim();
  let year = '';
  if (t.includes('.') && !t.includes(' ')) {
    const parts = t.split('.');
    const keep = [];
    for (const p of parts) {
      if (/^(19|20)\d{2}$/.test(p)) { year = p; break; }
      if (QUALITY.test(p)) break;
      keep.push(p);
    }
    t = keep.join(' ').trim();
  } else {
    const ym = t.match(/\((19|20)\d{2}\)|(19|20)\d{2}/);
    if (ym) year = ym[0].replace(/[()]/g, '');
    t = t.replace(/\[[^\]]*\]/g, '').replace(/\b(1080p|720p|2160p|WEBRip|WebRip|BluRay|x264|x265|DUAL|Filmbol|Türkçe|Altyazı|Dublaj)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  }
  return { title: t, year };
}
const normT = s => String(s || '').toLowerCase().replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) {}
let cacheDirty = false;
function saveCache() { if (cacheDirty) { fs.writeFileSync(CACHE, JSON.stringify(cache)); cacheDirty = false; } }

async function j(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { await new Promise(r => setTimeout(r, 1500 * (i + 1))); continue; }
      return r.ok ? await r.json() : null;
    } catch (e) { await new Promise(r => setTimeout(r, 600 * (i + 1))); }
  }
  return null;
}

let GENRES = { movie: {}, tv: {} };
async function loadGenres() {
  for (const k of ['movie', 'tv']) {
    const d = await j(`https://api.themoviedb.org/3/genre/${k}/list?api_key=${KEY}&language=tr-TR`);
    (d && d.genres || []).forEach(g => { GENRES[k][g.id] = g.name; });
  }
}

function pickBest(results, want) {
  if (!results || !results.length) return null;
  const w = normT(want);
  let best = null, bs = 0;
  for (const r of results) {
    for (const c of [r.title, r.name, r.original_title, r.original_name]) {
      if (!c) continue;
      const n = normT(c);
      let sc = 0;
      if (n === w) sc = 1;
      else if (n.includes(w) || w.includes(n)) sc = 0.6 + Math.min(n.length, w.length) / Math.max(n.length, w.length) * 0.3;
      if (sc > bs) { bs = sc; best = r; }
    }
  }
  return best || results[0];
}

async function enrich(kind, title, year) {
  const ck = kind + '|' + normT(title) + '|' + (year || '');
  if (ck in cache) return cache[ck];
  const k = kind === 'dizi' ? 'tv' : 'movie';
  const yParam = k === 'movie' ? 'primary_release_year' : 'first_air_date_year';
  let hit = null;
  if (year) {
    const d = await j(`https://api.themoviedb.org/3/search/${k}?query=${encodeURIComponent(title)}&${yParam}=${year}&include_adult=false&api_key=${KEY}&language=tr-TR`);
    hit = pickBest(d && d.results, title);
  }
  if (!hit) {
    const d = await j(`https://api.themoviedb.org/3/search/${k}?query=${encodeURIComponent(title)}&include_adult=false&api_key=${KEY}&language=tr-TR`);
    hit = pickBest(d && d.results, title);
  }
  if (!hit) {
    const d = await j(`https://api.themoviedb.org/3/search/${k}?query=${encodeURIComponent(title)}&include_adult=false&api_key=${KEY}&language=en-US`);
    hit = pickBest(d && d.results, title);
  }
  let out = null;
  if (hit) {
    out = {
      id: hit.id,
      img: IMG(hit.poster_path),
      backdrop: IMG(hit.backdrop_path, 'w1280'),
      y: String(hit.release_date || hit.first_air_date || '').slice(0, 4) || year || '',
      genres: (hit.genre_ids || []).map(id => GENRES[k][id]).filter(Boolean),
      rating: hit.vote_average ? hit.vote_average.toFixed(1) : '',
      desc: hit.overview || '',
      tmdbTitle: hit.title || hit.name || ''
    };
  }
  cache[ck] = out; cacheDirty = true;
  return out;
}

function parseManifest() {
  const films = new Map();
  const series = new Map();
  const lines = fs.readFileSync(MANIFEST, 'utf8').split('\n');
  let ok = 0, fail = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch (err) { continue; }
    if (e.ok === false || !e.stream || !e.url) { fail++; continue; }
    ok++;
    const m = e.url.match(/^https:\/\/filmmodu\.news\/(film|dizi|anime)\/([^/]+)(?:\/sezon-(\d+)\/bolum-(\d+))?/);
    if (!m) continue;
    const [, kind, slug, season, ep] = m;
    if (kind === 'film' && !season) {
      const { title, year } = cleanFilmTitle(e.title);
      const prev = films.get(slug);
      if (!prev || (e.ts || 0) > (prev.ts || 0)) {
        films.set(slug, { slug, t: title || slug, y: year, genres: [], platforms: ['FilmModu'], lang: '', img: '', url: e.stream, ref: REF, ua: UA, page: e.url, ts: e.ts || 0 });
      }
    } else if (season && ep) {
      const name = String(e.title || '').replace(/\s*\d+\.\s*Sezon\s*\d+\.\s*Bölüm.*$/i, '').trim() || slug;
      if (!series.has(slug)) series.set(slug, { slug, name, img: '', anime: kind === 'anime', genres: [], seasons: {}, page: `https://filmmodu.news/${kind}/${slug}`, ts: 0 });
      const s = series.get(slug);
      if (kind === 'anime') s.anime = true;
      if (!s.seasons[season]) s.seasons[season] = [];
      const list = s.seasons[season];
      const ex = list.find(x => String(x.e) === ep);
      const entry = { e: Number(ep), t: `${name} ${season}. Sezon ${ep}. Bölüm`, url: e.stream, ref: REF, ua: UA, page: e.url, ts: e.ts || 0 };
      if (ex) { if ((e.ts || 0) > (ex.ts || 0)) Object.assign(ex, entry); }
      else list.push(entry);
      s.ts = Math.max(s.ts || 0, e.ts || 0);
    }
  }
  for (const s of series.values()) for (const k of Object.keys(s.seasons)) s.seasons[k].sort((a, b) => a.e - b.e);
  return { films: [...films.values()], series: [...series.values()], ok, fail };
}

async function main() {
  const { films, series, ok, fail } = parseManifest();
  console.log(`manifest: ok=${ok} fail=${fail} | film=${films.length} dizi=${series.length}`);
  await loadGenres();
  console.log('TMDB tür listeleri hazır, zenginleştirme başlıyor…');
  let done = 0, hit = 0;
  const total = films.length + series.length;
  async function worker(queue) {
    while (queue.length) {
      const item = queue.shift();
      const kind = item.kind;
      const title = kind === 'film' ? item.t : item.name;
      const year = kind === 'film' ? item.y : '';
      try {
        const d = await enrich(kind, title, year);
        if (d) {
          hit++;
          item.img = d.img || '';
          item.backdrop = d.backdrop || '';
          item.genres = d.genres || [];
          item.rating = d.rating || '';
          item.desc = d.desc || '';
          item.tmdbId = d.id;
          if (kind === 'film') { if (d.y) item.y = d.y; if (d.tmdbTitle) item.t = d.tmdbTitle; }
          else if (d.y) item.y = d.y;
        }
      } catch (e) {}
      done++;
      if (done % 100 === 0) { console.log(`[${done}/${total}] eşleşen=${hit}`); saveCache(); }
      await new Promise(r => setTimeout(r, 60));
    }
  }
  const queue = [
    ...films.map(f => { f.kind = 'film'; return f; }),
    ...series.map(s => { s.kind = 'dizi'; return s; })
  ];
  await Promise.all(Array.from({ length: CONC }, () => worker(queue)));
  saveCache();
  films.forEach(f => delete f.kind); series.forEach(s => delete s.kind);
  const episodes = series.reduce((n, s) => n + Object.values(s.seasons).reduce((a, l) => a + l.length, 0), 0);
  const out = {
    meta: { generated: new Date().toISOString(), sources: { filmmodu: { label: 'FilmModu', films: films.length, series: series.length } }, films: films.length, series: series.length, episodes, enriched: hit },
    films, series
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`YAZILDI: ${OUT} | film=${films.length} dizi=${series.length} bölüm=${episodes} | TMDB eşleşen=${hit}/${total}`);
}
main().catch(e => { console.error(e); process.exit(1); });