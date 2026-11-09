// Extract filmmodu homepage content into a structured JSON consumed by the shell.
import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('C:/Users/sehab/Desktop/vuma_probe/fm_home2.html', 'utf8');

// Regex helpers -------------------------------------------------------------
function stripTags(s) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function decode(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
function localUrl(u) {
  if (!u) return '';
  const m = u.match(/\/storage\/tmdb\/[^/]+\/[^/]+\/([^?#]+)/);
  return m ? 'assets/img/' + m[1] : u;
}

// Split main into <section> blocks ----------------------------------------
const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
const sections = main.match(/<section[\s\S]*?<\/section>/g) || [];

// Hero ---------------------------------------------------------------------
const heroSec = sections.find(s => s.includes('role="region"') && s.includes('aria-label="Öne çıkan'));
const slides = [];
const slideRe = /<div[^>]*aria-label="\d+ \/ \d+ — ([^"]+)"[\s\S]*?<img src="([^"]+)"[\s\S]*?<\/div>\s*<\/div>\s*<div class="container-site[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
let m;
while ((m = slideRe.exec(heroSec))) {
  const whole = m[0];
  const title = decode(m[1]);
  const backdrop = localUrl(m[2]);
  const styleM = whole.match(/object-position:\s*([^;"]+)/);
  const objPos = styleM ? styleM[1].trim() : '50% 50%';
  const descM = whole.match(/<p class="mt-4[^"]*">([\s\S]*?)<\/p>/);
  const desc = descM ? decode(stripTags(descM[1])) : '';
  const ratingM = whole.match(/text-star">([\s\S]*?)<\/span>/);
  const rating = ratingM ? stripTags(ratingM[1]) : '';
  const yearM = whole.match(/text-content-secondary">(\d{4})<\/span>/);
  const year = yearM ? yearM[1] : '';
  const kindM = whole.match(/badge badge-(film|dizi|anime)">([^<]+)/);
  const kind = kindM ? stripTags(kindM[2]) : 'Film';
  const genresM = whole.match(/line-clamp-1[^"]*">([^<]+)</);
  const genres = genresM ? decode(genresM[1]) : '';
  const badgeExtrasM = [...whole.matchAll(/badge badge-soft">([^<]+)</g)].map(x => stripTags(x[1]));
  const hrefM = whole.match(/<a href="https:\/\/filmmodu\.news\/(film|dizi|anime)\/([^"]+)"/);
  const kindSlug = hrefM ? hrefM[1] : 'film';
  const slug = hrefM ? hrefM[2] : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  slides.push({ title, backdrop, objPos, desc, rating, year, kind, genres, tags: badgeExtrasM, slug, kindSlug, trailer: '' });
}

// Section-by-title extraction ----------------------------------------------
function findSectionByHeading(text) {
  return sections.find(s => s.includes(`>${text}</h2>`));
}

function extractPosterCard(inner) {
  const href = (inner.match(/href="([^"]+)"/) || [])[1] || '';
  const src = (inner.match(/<img src="([^"]+)"/) || [])[1] || '';
  const alt = (inner.match(/alt="([^"]+)"/) || [])[1] || '';
  const ratingM = inner.match(/badge badge-rating">\s*([\d.]+)/);
  const yearM = inner.match(/text-xs text-content-muted">(\d{4})/);
  const kindM = inner.match(/badge badge-(dizi|film|anime)">/);
  const titleM = inner.match(/<h3[^>]*>([^<]+)<\/h3>/);
  return {
    href,
    img: localUrl(src),
    title: titleM ? decode(titleM[1]) : decode(alt.replace(/ (Dizi|Film|Anime) izle$/, '')),
    rating: ratingM ? ratingM[1] : '',
    year: yearM ? yearM[1] : '',
    kind: kindM ? kindM[1] : ''
  };
}

// Trend rails (with big rank numbers)
function extractRankRail(sec) {
  const parts = sec.split(/<div class="flex shrink-0 snap-start items-end">/g).slice(1);
  return parts.map(ch => {
    const rank = (ch.match(/text-stroke[^>]*">(\d+)</) || ch.match(/>(\d+)<\/span>/) || [])[1] || '';
    return { rank, ...extractPosterCard(ch) };
  });
}

// Rail without rank (Son Eklenen Diziler)
function extractPlainRail(sec) {
  const parts = sec.split(/<div class="w-\[42vw\]/g).slice(1);
  return parts.map(extractPosterCard);
}

// Poster grid (Son Eklenen Filmler / Son Eklenen Animeler)
function extractPosterGrid(sec) {
  const parts = sec.split(/<a href="[^"]*" class="group block">/g).slice(1);
  return parts.map(extractPosterCard);
}

// Episode still grid (Son Eklenen Bölümler / Anime Bölümleri)
function extractEpisodeGrid(sec) {
  const parts = sec.split(/<a href="[^"]*" class="group block">/g).slice(1);
  return parts.map(ch => {
    const href = (ch.match(/href="([^"]+)"/) || [])[1] || '';
    const src = (ch.match(/<img src="([^"]+)"/) || [])[1] || '';
    const season = (ch.match(/badge badge-soft absolute[^>]*>([^<]+)</) || [])[1] || '';
    const titleM = ch.match(/<h3[^>]*>([^<]+)<\/h3>/);
    const epsM = ch.match(/text-content-secondary">([\s\S]*?)<\/p>/);
    const agoM = ch.match(/text-content-muted">([^<]+)<\/p>/);
    return {
      href, img: localUrl(src),
      title: titleM ? decode(titleM[1]) : '',
      season: decode(season),
      ep: epsM ? decode(stripTags(epsM[1])) : '',
      ago: agoM ? decode(agoM[1]) : ''
    };
  });
}

const trendDiziSec = findSectionByHeading('Trend Diziler');
const sonEkleDiziSec = findSectionByHeading('Son Eklenen Diziler');
const sonEkleBolumSec = findSectionByHeading('Son Eklenen Bölümler');
const trendFilmSec = findSectionByHeading('Trend Filmler');
const sonEkleFilmSec = findSectionByHeading('Son Eklenen Filmler');
const trendAnimeSec = findSectionByHeading('Trend Animeler');
const sonEkleAnimeSec = findSectionByHeading('Son Eklenen Animeler');
const sonEkleAnimeBolumSec = findSectionByHeading('Son Eklenen Anime Bölümleri');

const content = {
  hero: { slides },
  rails: {
    trendDizi: extractRankRail(trendDiziSec),
    sonEkleDizi: extractPlainRail(sonEkleDiziSec),
    trendFilm: extractRankRail(trendFilmSec),
    trendAnime: extractRankRail(trendAnimeSec),
    sonEkleAnime: extractPlainRail(sonEkleAnimeSec)
  },
  grids: {
    sonEkleFilm: extractPosterGrid(sonEkleFilmSec)
  },
  episodes: {
    dizi: extractEpisodeGrid(sonEkleBolumSec),
    anime: extractEpisodeGrid(sonEkleAnimeBolumSec)
  }
};

// Save
const outPath = 'C:/Users/sehab/Desktop/notflix-shell/assets/content.json';
fs.writeFileSync(outPath, JSON.stringify(content, null, 1));
const counts = {
  slides: content.hero.slides.length,
  trendDizi: content.rails.trendDizi.length,
  sonEkleDizi: content.rails.sonEkleDizi.length,
  trendFilm: content.rails.trendFilm.length,
  trendAnime: content.rails.trendAnime.length,
  sonEkleAnime: content.rails.sonEkleAnime.length,
  sonEkleFilm: content.grids.sonEkleFilm.length,
  epDizi: content.episodes.dizi.length,
  epAnime: content.episodes.anime.length
};
console.log('content.json counts:', counts);
