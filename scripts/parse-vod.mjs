// Parse multiple patr0n Scraper VOD m3u files into one normalized, de-duplicated vod.json.
import fs from 'node:fs';
import path from 'node:path';

const DESK = 'C:/Users/sehab/Desktop';
const OUT = path.join('C:/Users/sehab/Desktop/notflix-shell/assets', 'vod.json');

// Source registry: file glob-ish prefix -> src id + fixed kind ('film' | 'auto')
const SOURCES = [
  { match: /^VOD listesi/i, src: 'rectv', kind: 'auto', label: 'RecTV' },
  { match: /^fullhdfi/i, src: 'fullhd', kind: 'film', label: 'FullHD' },
  { match: /^jetfilm/i, src: 'jetfilm', kind: 'film', label: 'JetFilm' },
  { match: /^filmmodu/i, src: 'filmmodu', kind: 'film', label: 'FilmModu' },
  { match: /^dizipal/i, src: 'dizipal', kind: 'series', label: 'DiziPal' },
];

const GENRE_SET = new Set([
  'aksiyon', 'aksiyon & macera', 'animasyon', 'anime', 'belgesel', 'bilim-kurgu', 'bilim kurgu',
  'bilim kurgu & fantazi', 'dram', 'fantastik', 'fantazi', 'gerilim', 'gizem', 'komedi', 'korku',
  'macera', 'muzik', 'müzik', 'romantik', 'savaş', 'suç', 'tarih', 'aile', 'çocuk', 'çocuklar',
  'spor', 'western', 'vahşi batı', 'tv film', 'gerçeklik', 'talk', 'pembe dizi', 'savaş & siyasi'
]);
const PLATFORM_SET = new Set([
  'netflix', 'amazon', 'prime video', 'prime', 'disney+', 'apple tv+', 'blu tv', 'blutv',
  'hbo max', 'max', 'mubi', 'exxen', 'gain', 'bein', 'bein connect', 'tv8', 'tv100', 'kanal d',
  'show tv', 'atv', 'star tv', 'trt 1', 'trt', 'fox', 'now tv', 'krt', 'paramount+'
]);
const NOISE = /şarj bitiren|etkileyici|bringback|^#/i;

const norm = s => (s || '').trim().toLowerCase();
function slugify(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '').replace(/&/g, 've')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'x';
}
function cleanTitle(t) {
  return (t || '').replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\(\d{4}\)/, '')
    .replace(/\s*-\s*(Dublaj|Altyaz[ıi]|Dublaj & Altyaz[ıi])\s*$/i, '').trim();
}
function isEmbed(u) { return u && !/\.(m3u8|mp4)(\?|$)|index\.m3u8|master\.m3u8|\.urlset/i.test(u); }

function parseFile(file, src, kind) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const recs = [];
  let cur = null;
  const flush = () => { if (cur && cur.url) recs.push(cur); cur = null; };
  for (const ln of lines) {
    if (ln.startsWith('#EXTINF:')) {
      flush();
      cur = {
        gt: (ln.match(/group-title="([^"]*)"/) || [])[1] || '',
        logo: (ln.match(/tvg-logo="([^"]*)"/) || [])[1] || '',
        title: (ln.match(/group-title="[^"]*",(.*)$/) || [, ''])[1].trim()
      };
    } else if (ln.startsWith('#EXTVLCOPT:')) {
      if (!cur) continue;
      const r = ln.match(/http-referrer=(.*)$/), u = ln.match(/http-user-agent=(.*)$/);
      if (r) cur.ref = r[1].trim(); if (u) cur.ua = u[1].trim();
    } else if (ln && !ln.startsWith('#') && cur) { cur.url = ln.trim(); flush(); }
  }
  flush();

  const films = [], seriesMap = new Map();
  for (const { gt, logo, title, url, ref, ua } of recs) {
    const dash = gt.indexOf(' - ');
    const prefix = dash >= 0 ? gt.slice(0, dash) : gt;
    const rest = dash >= 0 ? gt.slice(dash + 3) : '';
    const tokens = rest.split('|').map(t => t.trim()).filter(Boolean);
    let isFilm = kind === 'film' ? true : kind === 'series' ? false : /filmler/i.test(prefix);
    const year = (title.match(/\((\d{4})\)/) || [])[1] || '';

    if (isFilm) {
      const genres = [], platforms = [];
      let lang = '';
      for (const t of tokens) {
        const n = norm(t);
        if (NOISE.test(t)) continue;
        if (/dublaj|altyaz/.test(n)) { if (!lang) lang = t; continue; }
        if (GENRE_SET.has(n)) genres.push(t);
        else if (PLATFORM_SET.has(n)) platforms.push(t);
      }
      films.push({ name: cleanTitle(title) || title, t: title, y: year, genres, platforms, lang, img: logo, url, ref, ua, src, embed: isEmbed(url) });
    } else {
      const name = tokens[0] || title.split(' - ')[0].trim();
      const sslug = slugify(name);
      let s = seriesMap.get(sslug);
      if (!s) { s = { slug: sslug, name, img: logo, src, seasons: {} }; seriesMap.set(sslug, s); }
      const seasonM = title.match(/(\d+)\.S\b/i) || title.match(/Sezon\s*(\d+)/i) || title.match(/(\d+)\.?\s*Sezon/i);
      const season = seasonM ? String(seasonM[1]) : '1';
      const epM = title.match(/Bölüm\s*(\d+)/i) || title.match(/Bolum\s*(\d+)/i) || title.match(/S\d+E(\d+)/i);
      const ep = epM ? parseInt(epM[1], 10) : (s.seasons[season] || []).length + 1;
      const langM = title.match(/(Dublaj|Altyaz[ıi])\s*$/i);
      const lang = langM ? langM[1] : '';
      const arr = (s.seasons[season] ||= []);
      // dedupe episode by (ep, lang)
      if (!arr.some(e => e.e === ep && e.lang === lang))
        arr.push({ e: ep, lang, t: title, url, ref, ua, embed: isEmbed(url) });
    }
  }
  return { films, series: [...seriesMap.values()] };
}

// ---- run all sources ----
const files = fs.readdirSync(DESK).filter(f => /\.m3u$/i.test(f));
const allFilms = [], allSeries = new Map();
const perSource = {};
for (const f of files) {
  const cfg = SOURCES.find(s => s.match.test(f));
  if (!cfg) continue;
  const { films, series } = parseFile(path.join(DESK, f), cfg.src, cfg.kind);
  perSource[cfg.src] = { label: cfg.label, films: films.length, series: series.length };
  allFilms.push(...films);
  for (const s of series) {
    const key = s.slug;
    if (allSeries.has(key)) { // merge seasons
      const ex = allSeries.get(key);
      for (const [sn, eps] of Object.entries(s.seasons)) {
        const arr = (ex.seasons[sn] ||= []);
        for (const e of eps) if (!arr.some(x => x.e === e.e && x.lang === e.lang)) arr.push(e);
      }
    } else allSeries.set(key, s);
  }
}

// ---- global film dedupe by (name+year) ----
const filmKey = f => (slugify(f.name) + '|' + (f.y || '')).toLowerCase();
const filmSeen = new Map();
for (const f of allFilms) {
  const k = filmKey(f);
  const prev = filmSeen.get(k);
  if (!prev) { filmSeen.set(k, f); continue; }
  // prefer a real stream over embed; merge genres/platforms/lang
  if (prev.embed && !f.embed) { const merged = { ...prev, ...f }; filmSeen.set(k, merged); }
  else {
    prev.genres = [...new Set([...prev.genres, ...f.genres])];
    prev.platforms = [...new Set([...prev.platforms, ...f.platforms])];
    if (!prev.lang && f.lang) prev.lang = f.lang;
  }
}
const films = [...filmSeen.values()];
// unique slugs
const slugSeen = new Map();
for (const f of films) {
  let base = slugify(f.name) + (f.y ? '-' + f.y : '');
  const n = (slugSeen.get(base) || 0) + 1; slugSeen.set(base, n);
  f.slug = n === 1 ? base : base + '-' + n;
}

const series = [...allSeries.values()];
for (const s of series) for (const k of Object.keys(s.seasons)) s.seasons[k].sort((a, b) => a.e - b.e);

const out = {
  meta: {
    generated: new Date().toISOString(),
    sources: perSource,
    films: films.length,
    series: series.length,
    episodes: series.reduce((n, s) => n + Object.values(s.seasons).reduce((m, a) => m + a.length, 0), 0)
  },
  films, series
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('WROTE', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2) + ' MB');
console.log('per-source:', JSON.stringify(perSource));
console.log('TOTAL films=%d series=%d episodes=%d', out.meta.films, out.meta.series, out.meta.episodes);
console.log('embed films:', films.filter(f => f.embed).length, '| stream films:', films.filter(f => !f.embed).length);
console.log('sample fullhd film:', JSON.stringify(films.find(f => f.src === 'fullhd')));
