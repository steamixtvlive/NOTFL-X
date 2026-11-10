// Gömülü ekran testi: yerel kilit (/site/), sitede zil (Destek yanında), başlık listesi +
// her bildirimin kendi modalı, zorunlu güncelleme kapısı ve "kaynak kapansa da arayüz açık" kanıtı.
const { app, BrowserWindow, ipcMain, session, webFrameMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { createSiteProxy } = require('../src/site-proxy');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(require('os').homedir(), 'Desktop', 'notflix-shotlar', 'embedtest');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
const results = [];
const ok = (name, pass, info) => { results.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (info ? ' — ' + info : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
process.on('unhandledRejection', e => {
  console.log('BEKLENMEYEN HATA: ' + ((e && e.message) || e));
  try { fs.writeFileSync(path.join(OUT, 'sonuc.json'), JSON.stringify(results, null, 2)); } catch (e2) {}
  process.exit(1);
});

app.whenReady().then(async () => {
  const cacheDir = path.join(OUT, 'site-cache');
  let proxy = createSiteProxy(cacheDir);
  const deadProxy = createSiteProxy(cacheDir, 'https://127.0.0.1:9'); // kaynak ölü taklidi
  const srv = http.createServer((req, res) => {
    const raw = req.url || '/';
    if (raw.startsWith('/site/') || raw === '/site') return proxy.handle(req, res, raw.slice(5));
    let p = decodeURIComponent(raw.split('?')[0]);
    if (p === '/') p = '/embed.html';
    const fp = path.normalize(path.join(ROOT, p));
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(fp, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); res.end(d); });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;

  let gateArmed = false;
  ipcMain.handle('update:check', async () => ({ ok: true, current: '1.0.1', latest: '9.9.9', update: gateArmed, url: 'https://github.com/steamixtvlive/NOTFL-X/releases/latest', notes: 'Test sürümü', published: '' }));
  ipcMain.handle('update:just-installed', async () => ({ ok: false }));
  ipcMain.handle('update:download', async () => ({ ok: false, error: 'test: indirme yok' }));
  ipcMain.handle('update:install', async () => ({ ok: false, error: 'test' }));
  ipcMain.handle('update:open', async () => ({ ok: true }));
  ipcMain.handle('mail:send', async () => ({ ok: true }));
  ipcMain.handle('account:state', async () => ({ ok: true, loggedIn: false }));
  ['win:minimize', 'win:toggle-max', 'win:close', 'win:fullscreen'].forEach(c => ipcMain.on(c, () => {}));
  await session.defaultSession.setPermissionRequestHandler((wc, p, cb) => cb(['fullscreen', 'mediaKeySystem', 'pointerLock'].includes(p)));

  const errors = [];
  const win = new BrowserWindow({
    width: 1360, height: 860, show: true, frame: false, backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(ROOT, 'src', 'preload.js'),
      additionalArguments: ['--notflix-content-path=' + path.join(ROOT, 'assets', 'content.json')],
      contextIsolation: true, nodeIntegration: false, sandbox: false, webSecurity: false
    }
  });
  win.webContents.on('console-message', (_e, _l, msg) => { if (/error/i.test(msg)) errors.push(msg); });

  // Marka enjeksiyonu: yerel kilit çerçevesine de aynen uygulanır (zil sitede görünür).
  let injectSrc = '';
  try {
    const fontB64 = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', 'BebasNeue.woff2')).toString('base64');
    injectSrc = fs.readFileSync(path.join(ROOT, 'src', 'embed-inject.js'), 'utf8').replace('__FONT_B64__', fontB64);
  } catch (e) {}
  win.webContents.on('did-frame-finish-load', (_e, isMain, pid, rid) => {
    if (isMain || !injectSrc) return;
    const frame = webFrameMain.fromId(pid, rid);
    if (frame && (frame.url || '').startsWith(base + '/site/')) frame.executeJavaScript(injectSrc).catch(() => {});
  });

  win.loadURL(base + '/embed.html');
  const ev = js => Promise.race([
    win.webContents.executeJavaScript(js),
    sleep(20000).then(() => { throw new Error('ev zaman asimi: ' + js.slice(0, 60)); })
  ]);
  const fev = js => ev('(() => { const f = document.getElementById(\'filmmodu-frame\'); return f.contentWindow.eval(' + JSON.stringify(js) + '); })()');
  const shot = async n => { await win.webContents.capturePage(); await sleep(120); const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(OUT, n + '.png'), img.toPNG()); };
  const settled = async () => { for (let i = 0; i < 20; i++) { const s = await ev("(() => { const f = document.getElementById('filmmodu-frame'); let rs = ''; try { rs = f.contentDocument.readyState; } catch (e) {} return { loader: document.getElementById('nfLoader').classList.contains('on'), rs }; })()").catch(() => null); if (s && !s.loader && s.rs === 'complete') return true; await sleep(400); } return false; };

  for (let i = 0; i < 25; i++) { if (await ev("!!(document.getElementById('splashEnter') && document.getElementById('filmmodu-frame'))").catch(() => false)) break; await sleep(400); }
  await ev("document.getElementById('splashEnter').click()");
  await sleep(4000); // site + enjeksiyon + ready

  // 1) iframe yerel kilitten besleniyor
  const frameInfo = await ev("(() => { const f = document.getElementById('filmmodu-frame'); return { src: f.src, ready: f.dataset.nfReady }; })()");
  ok('iframe-yerel-kilit', /\/site\//.test(frameInfo.src), JSON.stringify(frameInfo));

  // 2) zil sitede, Geliştiriciye Destek'in yanında
  let bellPos = {};
  for (let i = 0; i < 20; i++) {
    bellPos = await fev("(() => { const b = document.getElementById('nfBellNav'); const g = document.getElementById('nfBagisNav'); if (!b || !g) return { bell: !!b, bagis: !!g }; return { bell: true, bagis: true, nextTo: b.previousElementSibling === g || b.nextElementSibling === g, leftOf: b.nextElementSibling === g, dot: getComputedStyle(document.getElementById('nfBellNavDot')).display !== 'none' }; })()").catch(() => ({}));
    if (bellPos.bell && bellPos.bagis) break;
    await sleep(700);
  }
  ok('zil-destek-yaninda', bellPos.bell && bellPos.bagis && bellPos.nextTo && bellPos.leftOf, JSON.stringify(bellPos));
  await shot('01-site-zil');

  // 3) zil → başlık listesi (minik kartlar, kaydırılabilir)
  await fev("document.getElementById('nfBellNav').click()");
  await sleep(600);
  const list = await ev("(() => { const w = document.getElementById('nfNotifWrap'); const p = document.getElementById('nfPool'); return { open: w.classList.contains('open'), rows: p.querySelectorAll('.nfp-row').length, unread: p.querySelectorAll('.nfp-row.unread').length, scrollable: p.scrollHeight > p.clientHeight + 10, scrollH: p.scrollHeight, clientH: p.clientHeight }; })()");
  ok('baslik-listesi', list.open && list.rows >= 8 && list.unread >= 8 && (list.scrollable || list.scrollH <= list.clientH), JSON.stringify(list));
  const soon = await ev("(() => { const s = document.querySelector('#nfPool .nfp-row.soon'); if (!s) return null; const o = document.querySelectorAll('#nfPool .nfp-row')[1]; return { bg: getComputedStyle(s).backgroundColor, other: getComputedStyle(o).backgroundColor, title: s.querySelector('b').textContent }; })()");
  ok('cok-yakinda-vurgulu', !!soon && soon.bg !== soon.other && /Çok Yakında/.test(soon.title), JSON.stringify(soon));
  const poolDash = await ev("/[—–•]/.test(document.getElementById('nfNotifPanel').textContent)");
  ok('havuz-tiresiz', poolDash === false, JSON.stringify({ dash: poolDash }));
  const anch = await ev("(() => { const p = document.getElementById('nfNotifPanel'); const r = p.getBoundingClientRect(); const fr = document.getElementById('filmmodu-frame'); const frR = fr.getBoundingClientRect(); const b = fr.contentWindow.document.getElementById('nfBellNav').getBoundingClientRect(); const bb = frR.top + b.bottom; return { gap: Math.round(r.top - bb), w: Math.round(r.width), h: Math.round(r.height), ih: innerHeight, centered: Math.abs((r.left + r.width / 2) - innerWidth / 2) < 40 && r.top > innerHeight * 0.3 }; })()");
  ok('havuz-cekmace', anch.gap >= 0 && anch.gap <= 30 && anch.w <= 420 && anch.h <= anch.ih * 0.8 && !anch.centered, JSON.stringify(anch));
  await sleep(450);
  await shot('02-liste');

  // 4) satır → kendi modalı (animasyonlu cihaz dahil)
  await ev("document.querySelector('#nfPool .nfp-row').click()");
  await sleep(500);
  const det = await ev("(() => { const d = document.getElementById('nfDetailWrap'); return { open: d.classList.contains('open'), title: document.getElementById('nfDetailTitle').textContent, devices: !!d.querySelector('.nfp-devices'), hero: !!d.querySelector('.nfd-hero svg'), body: document.getElementById('nfDetailBody').textContent.length, dash: /[—–•]/.test(document.getElementById('nfDetailTitle').textContent + document.getElementById('nfDetailBody').textContent) }; })()");
  ok('bildirim-kendi-modal', det.open && /Sinema Her Ekranda/.test(det.title) && det.devices && det.hero && det.body > 100 && !det.dash, JSON.stringify(det));
  await shot('03-detay-modal');
  const readOne = await ev("(() => { const r = JSON.parse(localStorage.getItem('nf_notif_read') || '[]'); return { read: r.length, rowUnread: document.querySelectorAll('#nfPool .nfp-row.unread').length }; })()");
  ok('okundu-isaretlendi', readOne.read === 1 && readOne.rowUnread === 7, JSON.stringify(readOne));

  // 5) ESC önce detayı, sonra listeyi kapatır
  await ev("window.focus(); document.getElementById('nfDetailClose').focus()");
  await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await sleep(300);
  const esc1 = await ev("({ det: document.getElementById('nfDetailWrap').classList.contains('open'), list: document.getElementById('nfNotifWrap').classList.contains('open') })");
  ok('esc-detay-kapatir', !esc1.det && esc1.list, JSON.stringify(esc1));
  await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await sleep(300);
  const esc2 = await ev("!document.getElementById('nfNotifWrap').classList.contains('open')");
  ok('esc-liste-kapatir', esc2);

  // 6) tek tek okundu → zil noktası sitede söner (toplu işaretleme düğmesi yok)
  await fev("document.getElementById('nfBellNav').click()");
  await sleep(400);
  for (let i = 0; i < 8; i++) {
    await ev("document.querySelectorAll('#nfPool .nfp-row')[" + i + "].click()");
    await sleep(200);
    await ev("document.getElementById('nfDetailClose').click()");
    await sleep(150);
  }
  const dotOff = await fev("getComputedStyle(document.getElementById('nfBellNavDot')).display === 'none'");
  ok('zil-nokta-soner', dotOff);
  ok('readall-kaldirildi', await ev("!document.getElementById('nfReadAll')"));
  await ev("document.getElementById('nfNotifClose').click()");

  // 6a) Vizyon metni genel tonda: "inat" yok, "kulak asmıyoruz" var
  await fev("document.getElementById('nfBellNav').click()");
  await sleep(400);
  await ev("document.querySelector('#nfPool [data-nf-id=\"vizyon-durus\"]').click()");
  await sleep(400);
  const viz = await ev("document.getElementById('nfDetailBody').textContent");
  ok('vizyon-genel-ton', /kulak asmıyoruz/.test(viz) && !/inat/.test(viz) && !/küçümse/.test(viz), JSON.stringify({ len: viz.length }));
  await shot('03b-vizyon-modal');
  await ev("document.getElementById('nfDetailClose').click()");
  await ev("document.getElementById('nfNotifClose').click()");

  // 6c) Canlı TV: başka panele geçince yayın kaynağı boşalır, ses anında kesilir
  await ev("window.postMessage({ nf: 'panel', panel: 'canli' }, '*')");
  await sleep(600);
  const canliOn = await ev("document.getElementById('nfCanliFrame').src");
  await ev("window.postMessage({ nf: 'panel', panel: 'iletisim' }, '*')");
  await sleep(300);
  const canliOff = await ev("document.getElementById('nfCanliFrame').src");
  ok('canli-sekme-degisince-ses-kesik', /131\.123\.43\.89/.test(canliOn) && canliOff === 'about:blank', JSON.stringify({ on: canliOn, off: canliOff }));
  await ev("window.postMessage({ nf: 'panel', panel: 'canli' }, '*')");
  await sleep(300);
  const canliAgain = await ev("document.getElementById('nfCanliFrame').src");
  ok('canli-tekrar-acilinca-yuklenir', /131\.123\.43\.89/.test(canliAgain), JSON.stringify({ src: canliAgain }));
  await ev("document.getElementById('nfClose').click()");
  await sleep(300);
  ok('canli-kapatinca-da-kesik', await ev("document.getElementById('nfCanliFrame').src === 'about:blank'"));

  // 6b) Sitenin kendi Takvim ve IMDB Top 250 sekmeleri yerel kilit üzerinden çalışıyor
  const pollFrame = async (src, tries = 25) => { for (let i = 0; i < tries; i++) { const v = await fev(src).catch(() => null); if (v) return v; await sleep(600); } return null; };
  const bodyReady = () => pollFrame("(() => document.body && document.querySelector('header') ? true : null)()", 20);
  const clickNav = re => fev("(() => { const all = Array.from(document.querySelectorAll('header a')).filter(x => new RegExp(" + JSON.stringify(re) + ").test(x.textContent || '')); const a = all.find(x => x.offsetParent !== null) || all[0]; if (a) a.click(); return a ? a.getAttribute('href') : null; })()");
  const TAK_SRC = "(() => { if (!document.body) return null; const t = (document.body.innerText || ''); return /takvim/.test(location.pathname) && t.length > 300 ? { url: location.pathname, text: t.length } : null; })()";
  const TOP_SRC = "(() => { if (!document.body) return null; const t = (document.body.innerText || ''); return /top-250/.test(location.pathname) && t.length > 3000 && /250/.test(t) ? { url: location.pathname, text: t.length, has250: true } : null; })()";
  await bodyReady();
  const hrefTak = await clickNav('Takvim');
  let tak = await pollFrame(TAK_SRC);
  if (!tak && hrefTak) { await fev("location.href = " + JSON.stringify(hrefTak)).catch(() => {}); tak = await pollFrame(TAK_SRC); }
  ok('takvim-sekmesi', !!tak, JSON.stringify(tak || {}));
  await settled();
  await shot('08-takvim');
  await bodyReady();
  const hrefTop = await clickNav('Top 250');
  let top = await pollFrame(TOP_SRC);
  if (!top && hrefTop) { await fev("location.href = " + JSON.stringify(hrefTop)).catch(() => {}); top = await pollFrame(TOP_SRC); }
  ok('top250-sekmesi', !!top, JSON.stringify(top || {}));
  await settled();
  await shot('09-top250');
  await fev("(() => { const a = document.querySelector('header a[href=\"/site/\"]') || document.querySelector('header a[href=\"/site\"]') || document.querySelector('header a[href=\"/\"]') || document.querySelector('header a'); if (a) a.click(); return !!a; })()").catch(() => false);
  await sleep(2500);

  // 7) KAYNAK ÖLDÜ: aynı önbellekten arayüz aynen açık kalır
  await shot('04-once-canli');
  proxy = deadProxy;
  await ev("(() => { const f = document.getElementById('filmmodu-frame'); f.src = f.src; return true; })()");
  await sleep(4000);
  const alivePoll = async () => {
    for (let i = 0; i < 15; i++) {
      const a = await fev("(() => { if (!document.body) return null; return { header: !!document.querySelector('header'), brand: document.querySelectorAll('.nf-word').length, bell: !!document.getElementById('nfBellNav'), text: (document.body.innerText || '').length, url: location.href }; })()").catch(() => null);
      if (a && a.header && a.bell) return a;
      await sleep(700);
    }
    return { header: false, brand: 0, bell: false, text: 0 };
  };
  const alive = await alivePoll();
  ok('kaynak-olse-de-arayuz-acik', alive.header && alive.brand > 0 && alive.bell && alive.text > 500, JSON.stringify(alive));
  await shot('05-kaynak-oldu-arayuz-acik');
  proxy = createSiteProxy(cacheDir);

  // 9) dar ekran: çekmece ve detay modalı ekrana sığar, taşma yok
  await win.setSize(420, 860);
  await sleep(500);
  await ev("(() => { const f = document.getElementById('filmmodu-frame'); f.src = f.src; return true; })()");
  await sleep(1500); // eski belge yerine yenisi geçsin
  let narrowBell = false;
  for (let i = 0; i < 15; i++) {
    narrowBell = await fev("!!document.getElementById('nfBellNav')").catch(() => false);
    if (narrowBell) break;
    await sleep(600);
  }
  await settled();
  await sleep(800); // load olayı ve çekmece kapatması bitsin
  await fev("(() => { const b = document.getElementById('nfBellNav'); if (b) b.click(); return !!b; })()").catch(() => false);
  await sleep(600);
  const narrowList = await ev("(() => { const p = document.getElementById('nfNotifPanel'); const r = p.getBoundingClientRect(); return { open: document.getElementById('nfNotifWrap').classList.contains('open'), left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), iw: innerWidth, ih: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth }; })()");
  ok('dar-ekme-cekmace', narrowBell && narrowList.open && narrowList.left >= 0 && narrowList.right <= narrowList.iw && narrowList.top >= 0 && narrowList.bottom <= narrowList.ih && !narrowList.overflowX, JSON.stringify(narrowList));
  await shot('10-dar-liste');
  await ev("(() => { const r = document.querySelector('#nfPool .nfp-row'); if (r) r.click(); return !!r; })()");
  await sleep(500);
  const narrowDet = await ev("(() => { const c = document.querySelector('#nfDetailWrap .nfd-card'); const r = c.getBoundingClientRect(); return { open: document.getElementById('nfDetailWrap').classList.contains('open'), left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), iw: innerWidth, ih: innerHeight, scroll: c.scrollHeight > c.clientHeight }; })()");
  ok('dar-ekme-detay', narrowDet.open && narrowDet.left >= 0 && narrowDet.right <= narrowDet.iw && narrowDet.top >= 0 && narrowDet.bottom <= narrowDet.ih, JSON.stringify(narrowDet));
  await shot('11-dar-detay');
  await ev("document.getElementById('nfDetailClose').click()");
  await ev("document.getElementById('nfNotifClose').click()");
  await win.setSize(1360, 860);
  await sleep(500);

  // 8) zorunlu güncelleme kapısı
  gateArmed = true;
  await win.loadURL(base + '/embed.html');
  await sleep(1500);
  await ev("document.getElementById('splashEnter') && document.getElementById('splashEnter').click()");
  await sleep(5500);
  const gate = await ev("(() => { const g = document.getElementById('nfGate'); const r = g.getBoundingClientRect(); const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return { on: g.classList.contains('on'), w: r.width, h: r.height, iw: innerWidth, ih: innerHeight, topIsGate: !!(top && top.closest('#nfGate')) }; })()");
  ok('kapi-acildi-kilitli', gate.on && gate.topIsGate && gate.w >= gate.iw - 20 && gate.h >= gate.ih - 20, JSON.stringify(gate));
  await shot('06-guncelleme-kapisi');
  await win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  await win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await sleep(300);
  ok('kapi-esc-dusurmez', await ev("document.getElementById('nfGate').classList.contains('on')"));
  await ev("document.getElementById('nfGateGo').click()");
  await sleep(800);
  const retry = await ev("(() => ({ btn: document.getElementById('nfGateGo').textContent, err: document.getElementById('nfGateErr').textContent, on: document.getElementById('nfGate').classList.contains('on') }))()");
  ok('kapi-hata-tekrar-dene', retry.on && /Tekrar Dene/.test(retry.btn) && retry.err.length > 0, JSON.stringify(retry));
  await shot('07-kapi-hata');

  const realErrors = errors.filter(e => !/net::|Failed to load resource|ERR_CONNECTION|err_connection/i.test(e));
  ok('konsol-hatasiz', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
  const pass = results.filter(r => r.pass).length;
  console.log('SONUC: ' + pass + '/' + results.length);
  fs.writeFileSync(path.join(OUT, 'sonuc.json'), JSON.stringify(results, null, 2));
  app.exit(pass === results.length ? 0 : 1);
});