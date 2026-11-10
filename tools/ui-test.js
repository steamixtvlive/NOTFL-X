// NOTFLİX uçtan uca arayüz testi: gerçek Electron penceresinde açılış, katalog, detay,
// gerçek HLS oynatma, Top 250, Takvim, arama, bildirim modalı, güncelleme kapısı kilidi, dar ekran.
// Çalıştır: node_modules/electron/dist/electron.exe tools/ui-test.js
const { app, BrowserWindow, session, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const scraper = require('../src/scraper');

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(app.getPath('desktop'), 'notflix-shotlar', 'uitest');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const results = [];
const ok = (name, pass, info) => { results.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL') + ' | ' + name + (info ? ' | ' + info : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let gateMode = true; // ilk açılışta sahte "yeni sürüm" → kapı testi; sonra kapatılıp normal akış.

app.whenReady().then(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/') p = '/index.html';
    const fp = path.normalize(path.join(ROOT, p));
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;

  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, cb) => {
    const u = details.url || '';
    if (/pilavyerplay\.top|pilavyer2\.top/i.test(u)) {
      details.requestHeaders['Referer'] = 'https://filmmodu.news/';
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    }
    cb({ requestHeaders: details.requestHeaders });
  });

  ipcMain.handle('stream:resolve', async (_e, pageUrl) => {
    try { return await scraper.resolveStream(String(pageUrl)); } catch (e) { return { ok: false, error: String(e.message || e) }; }
  });
  ipcMain.handle('data:top250', async () => {
    try { return { ok: true, data: JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'top250.json'), 'utf8')) }; } catch (e) { return { ok: false }; }
  });
  ipcMain.handle('update:check', async () => gateMode
    ? { ok: true, update: true, current: '1.0.1', latest: '9.9.9', url: 'https://github.com/steamixtvlive/NOTFL-X/releases/latest', notes: 'Test güncellemesi' }
    : { ok: true, update: false, current: '1.0.1', latest: '1.0.1' });
  ipcMain.handle('update:just-installed', async () => ({ ok: false }));
  ipcMain.handle('update:download', async () => ({ ok: false, error: 'test: indirme yok' }));
  ipcMain.on('win:fullscreen', () => {});

  const win = new BrowserWindow({
    width: 1360, height: 860, show: false, frame: false, backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(ROOT, 'src', 'preload.js'),
      additionalArguments: ['--notflix-content-path=' + path.join(ROOT, 'assets', 'content.json'), '--notflix-userdata=' + app.getPath('userData')],
      contextIsolation: true, nodeIntegration: false, sandbox: false, webSecurity: false
    }
  });
  const consoleErrors = [];
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && /error|uncaught|failed/i.test(message) && !/net::|favicon|tmdb|themoviedb/i.test(message)) consoleErrors.push(message); });
  const shot = async name => { const img = await win.capturePage(); fs.writeFileSync(path.join(SHOTS, name + '.png'), img.toPNG()); };
  const js = code => win.webContents.executeJavaScript(code, true);
  const ready = async () => { for (let i = 0; i < 50; i++) { if (await js('window.__notflixReady === true').catch(() => false)) return true; await sleep(300); } return false; };

  // ---- 1) Güncelleme kapısı: her şeyi kilitler, ESC geçmez, hata yolu çalışır ----
  await win.loadURL(base + '/index.html?shot=1');
  await ready();
  await sleep(1200);
  let gate = await js(`(function(){
    const g = document.querySelector('.nf-gate');
    if (!g) return { open: false };
    const r = g.getBoundingClientRect();
    const el = document.elementFromPoint(innerWidth/2, innerHeight/2);
    const btn = g.querySelector('[data-gate-go]');
    return { open: true, covers: r.width >= innerWidth - 1 && r.height >= innerHeight - 1, topElement: !!(el && el.closest('.nf-gate')), btn: btn ? btn.textContent : '' };
  })()`);
  ok('guncelleme-kapisi-acildi', gate.open && gate.covers && gate.topElement, JSON.stringify(gate));
  await shot('01-guncelleme-kapisi');
  await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await sleep(300);
  ok('kapı-esc-ile-kapanmiyor', await js('!!document.querySelector(".nf-gate")'));
  await js('document.querySelector("[data-gate-go]").click()');
  await sleep(800);
  const gateErr = await js(`(function(){ const e = document.querySelector('[data-gate-err]'); const b = document.querySelector('[data-gate-go]'); return { err: e ? e.textContent : '', btn: b ? b.textContent : '', stillOpen: !!document.querySelector('.nf-gate') }; })()`);
  ok('kapı-indirme-hata-yolu', gateErr.stillOpen && /Tekrar Dene/.test(gateErr.btn) && gateErr.err.length > 0, JSON.stringify(gateErr));
  await shot('02-kapi-hata');

  // ---- 2) Kapı kapalı: normal akış ----
  gateMode = false;
  await win.loadURL(base + '/index.html?shot=1');
  await ready();
  await sleep(2500);
  ok('kapı-yok-normal-acilis', await js('!document.querySelector(".nf-gate")'));
  const home = await js(`(function(){
    const slides = document.querySelectorAll('.slide').length;
    const cards = document.querySelectorAll('#app a[href^="#/detay/"]').length;
    const imgs = Array.from(document.querySelectorAll('#app img')).filter(i => i.src);
    const loaded = imgs.filter(i => i.complete && i.naturalWidth > 0).length;
    const overflow = document.documentElement.scrollWidth > innerWidth + 2;
    return { slides, cards, imgs: imgs.length, loaded, overflow };
  })()`);
  ok('anasayfa-icerik', home.slides >= 10 && home.cards > 30 && !home.overflow, JSON.stringify(home));
  await shot('03-anasayfa');

  // ---- 3) Katalog ----
  await js('location.hash="#/katalog/filmler"');
  await sleep(1800);
  const cat = await js(`(function(){ const c = document.querySelectorAll('#app a[href^="#/detay/"]').length; const t = document.querySelector('#app h1'); return { cards: c, title: t ? t.textContent : '' }; })()`);
  ok('katalog-filmler', cat.cards >= 50, JSON.stringify(cat));
  await shot('04-katalog');

  // ---- 4) Detay + TMDB zenginleştirme ----
  await js('location.hash="#/detay/backrooms/film"');
  await sleep(4500);
  const det = await js(`(function(){
    const r = document.getElementById('tmdb-rating'), d = document.getElementById('tmdb-desc'), y = document.getElementById('tmdb-year');
    const poster = document.querySelector('#app .aspect-\\\\[2\\\\/3\\\\] img');
    return { rating: r ? r.textContent : '', descLen: d ? d.textContent.length : 0, year: y ? y.textContent : '', poster: poster ? poster.src.slice(0, 60) : '' };
  })()`);
  ok('detay-zenginlestirme', det.descLen > 20 && /★/.test(det.rating), JSON.stringify(det));
  await shot('05-detay');

  // ---- 5) Gerçek HLS oynatma (taze token + referer enjeksiyonu) ----
  await js('document.querySelector("[data-play]").click()');
  await sleep(9000);
  const play = await js(`(function(){
    const v = document.getElementById('fsVideo');
    const ov = document.getElementById('fsPlayer');
    if (!v) return { player: !!ov, video: false };
    return { player: !!ov, video: true, time: v.currentTime, dur: v.duration || 0, paused: v.paused, w: v.videoWidth, h: v.videoHeight, err: v.error ? v.error.code : 0 };
  })()`);
  ok('gercek-oynatma', play.video && play.time > 0.5 && !play.err, JSON.stringify(play));
  await shot('06-oynatici');
  await js('document.querySelector("[data-pclose]") && document.querySelector("[data-pclose]").click()');
  await sleep(500);

  // ---- 6) Top 250 ----
  await js('location.hash="#/top250"');
  await sleep(2500);
  const top = await js(`(function(){ const g = document.getElementById('top250Grid'); const c = document.getElementById('top250Count'); return { cards: g ? g.children.length : 0, count: c ? c.textContent : '' }; })()`);
  ok('top250', top.cards >= 240, JSON.stringify(top));
  await shot('07-top250');

  // ---- 7) Takvim ----
  await js('location.hash="#/takvim"');
  await sleep(9000);
  const tak = await js(`(function(){ const g = document.getElementById('takvimGrid'); if (!g) return { cols: 0 }; const cols = g.children.length; const cards = g.querySelectorAll('img').length; return { cols, cards, text: g.textContent.slice(0, 80) }; })()`);
  ok('takvim-gercek', tak.cols === 7, JSON.stringify(tak));
  await shot('08-takvim');

  // ---- 8) Arama ----
  await js('location.hash="#/ara?q=backrooms"');
  await sleep(1200);
  const ara = await js(`(function(){ return { cards: document.querySelectorAll('#app a[href^="#/detay/"]').length, input: (document.getElementById('araInput')||{}).value || '' }; })()`);
  ok('arama', ara.cards >= 1 && ara.input === 'backrooms', JSON.stringify(ara));

  // ---- 9) Bildirimler ----
  await js('location.hash="#/"');
  await sleep(1200);
  await js('document.getElementById("nfBell").click()');
  await sleep(600);
  const notif = await js(`(function(){
    const m = document.querySelector('.nf-modal'); if (!m) return { open: false };
    const pool = m.querySelector('.nf-pool');
    return { open: true, items: m.querySelectorAll('.nf-notif').length, scrollable: pool.scrollHeight > pool.clientHeight + 40, devices: !!m.querySelector('.nf-devices'), dotHidden: document.getElementById('nfBellDot').classList.contains('hidden') };
  })()`);
  ok('bildirim-modal', notif.open && notif.items >= 6 && notif.scrollable && notif.devices, JSON.stringify(notif));
  await shot('09-bildirimler');
  await js('document.querySelector(".nf-pool").scrollTop = 400');
  await sleep(300);
  await shot('10-bildirim-scroll');
  await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await sleep(300);
  ok('bildirim-esc-kapanis', await js('!document.querySelector(".nf-modal")'));

  // ---- 10) Dar ekran ----
  win.setSize(820, 720);
  await sleep(800);
  const narrow = await js(`(function(){ return { overflow: document.documentElement.scrollWidth > innerWidth + 2, vw: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
  ok('dar-ekran-tasma-yok', !narrow.overflow, JSON.stringify(narrow));
  await shot('11-dar-ekran');

  ok('konsol-hatasiz', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));
  const fails = results.filter(r => !r.pass);
  console.log('SONUC: ' + (results.length - fails.length) + '/' + results.length + ' PASS');
  console.log('SHOTS: ' + SHOTS);
  app.exit(fails.length ? 1 : 0);
});