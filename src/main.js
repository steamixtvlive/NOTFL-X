const { app, BrowserWindow, session, ipcMain, screen, webFrameMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const account = require('./account');

const shotMode = process.argv.includes('--shot');
const contentPath = path.join(__dirname, '..', 'assets', 'content.json');
const ROOT = path.join(__dirname, '..');

// Uygulama file:// yerine yerel http üzerinden yüklenir: YouTube embed'leri (fragman) gerçek origin ister,
// file://'dan "oynatıcı hatası" verir. Sıfır maliyet, yalnızca kendi dosyalarımızı sunan dahili sunucu.
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.m3u8': 'application/vnd.apple.mpegurl' };
let appUrl = null;
function startServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      const fp = path.normalize(path.join(ROOT, p));
      if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(0, '127.0.0.1', () => { appUrl = 'http://127.0.0.1:' + srv.address().port; resolve(); });
  });
}

// Bu kabuk disaridan hicbir sey yuklemiyor: tek adres kendi klasorumuz.
app.commandLine.appendSwitch('disable-features', 'Translate,MediaControlsShowThumbnailPreview');

function createWindow (hidden) {
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: shotMode ? 1360 : wa.width,
    height: shotMode ? 860 : wa.height,
    x: shotMode ? undefined : 0,
    y: shotMode ? undefined : 0,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    title: 'NOTFLİX',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: ['--notflix-content-path=' + contentPath],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      webSecurity: false,
      media: true
    }
  });
  win.once('ready-to-show', () => { if (!shotMode) win.maximize(); win.show(); });
  // Embed modu: filmmodu.news doğrudan iframe içinde (shot modu eski arayüzde kalır)
  win.loadURL(appUrl + (shotMode ? '/index.html?shot=1' : '/embed.html'));
  return win;
}

app.whenReady().then(async () => {
  await startServer();
  account.init();
  // Tam ekran ve DRM (encrypted-media) izinleri serbest; konum/bildirim/kamera gibi gereksiz istekler reddedilir.
  await session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    const allow = new Set(['fullscreen', 'mediaKeySystem', 'pointerLock']);
    cb(allow.has(permission));
  });

  // filmmodu.news iframe embed: X-Frame-Options ve CSP frame-ancestors kilitlerini kaldır
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://filmmodu.news/*', '*://*.filmmodu.news/*'] },
    (details, cb) => {
      const headers = details.responseHeaders || {};
      delete headers['x-frame-options'];
      delete headers['X-Frame-Options'];
      // CSP'yi tamamen kaldır: enjekte ettiğimiz marka stili/fontu ve modallar serbest çalışsın.
      delete headers['content-security-policy'];
      delete headers['Content-Security-Policy'];
      delete headers['content-security-policy-report-only'];
      delete headers['Content-Security-Policy-Report-Only'];
      cb({ responseHeaders: headers });
    }
  );

  // VOD kaynakları (HLS) sahte referer/UA istiyor — tarama listesindeki gibi enjekte et.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    (details, cb) => {
      const u = details.url || '';
      if (/load\.[^/]*\.autos|\.m3u8|\.ts(\?|$)|prectv73|\.urlset/i.test(u)) {
        details.requestHeaders['Referer'] = 'https://twitter.com/';
        if (details.requestHeaders['User-Agent']) details.requestHeaders['User-Agent'] = 'googleusercontent';
      }
      cb({ requestHeaders: details.requestHeaders });
    }
  );

  // İletişim formu: mesajı gizli tutulan alıcıya ilet. Adres yalnızca bu süreçte durur, arayüzde görünmez.
  const MAIL_TO = 'steamixgame@yandex.com';
  ipcMain.handle('mail:send', async (_e, payload) => {
    payload = payload || {};
    try {
      const body = {
        _subject: 'NOTFLİX İletişim: ' + (payload.topic || 'Mesaj'),
        _template: 'table',
        _captcha: 'false',
        Name: payload.name || '',
        Email: payload.email || '',
        ReplyTo: payload.email || '',
        Topic: payload.topic || '',
        Message: payload.message || ''
      };
      const r = await fetch('https://formsubmit.co/ajax/' + MAIL_TO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://notflix.app',
          Referer: 'https://notflix.app/'
        },
        body: JSON.stringify(body)
      });
      const j = await r.json().catch(() => ({}));
      // FormSubmit başarıyı string "true" olarak döndürür; HTTP 200 tek başına yetmez (aktivasyon/başlık hatası da 200 gelir).
      const ok = r.ok && String(j.success) === 'true';
      return { ok, status: r.status, message: j.message || '', res: j };
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  });

  // Güncelleme: sürüm bilgisi GitHub'daki update.json'dan okunur. Yeni setup yayınlandığında
  // yalnızca bu dosyadaki version/url alanlarını güncellemek yeterlidir.
  const UPDATE_JSON = 'https://raw.githubusercontent.com/steamixtvlive/NOTFL-X/main/update.json';
  const verParts = v => String(v || '').trim().replace(/^v/i, '').split(/[^0-9]+/).filter(Boolean).map(n => parseInt(n, 10) || 0);
  const isNewer = (latest, current) => {
    const a = verParts(latest), b = verParts(current);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] || 0, y = b[i] || 0;
      if (x !== y) return x > y;
    }
    return false;
  };
  ipcMain.handle('update:check', async () => {
    const current = app.getVersion();
    try {
      const r = await fetch(UPDATE_JSON + '?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'NOTFLIX-Updater' }
      });
      if (!r.ok) return { ok: false, current, error: 'HTTP ' + r.status };
      const j = await r.json();
      const latest = String(j.version || j.latest || '').trim();
      if (!latest) return { ok: false, current, error: 'Sürüm bilgisi yok' };
      const url = String(j.url || j.download || j.setup || '').trim();
      return {
        ok: true,
        current,
        latest,
        update: isNewer(latest, current),
        url,
        notes: String(j.notes || j.changelog || ''),
        published: String(j.published || '')
      };
    } catch (e) {
      return { ok: false, current, error: String((e && e.message) || e) };
    }
  });
  ipcMain.handle('update:open', async (_e, url) => {
    try {
      const u = new URL(String(url || ''));
      if (u.protocol !== 'https:') return { ok: false };
      const host = u.hostname.toLowerCase();
      const allowed = (host === 'github.com' && u.pathname.toLowerCase().startsWith('/steamixtvlive/notfl-x')) ||
        host === 'objects.githubusercontent.com' || host === 'github-releases.githubusercontent.com';
      if (!allowed) return { ok: false };
      await shell.openExternal(u.toString());
      return { ok: true };
    } catch (e) {
      return { ok: false };
    }
  });

  const win = createWindow(shotMode);
  win.webContents.on('console-message', (...a) => { const msg = a.find(x => typeof x === 'string' && /ERROR|Error/.test(x)); if (msg) console.log('CONSOLE:', msg); });

  // Embed marka enjeksiyonu: filmmodu çerçevesi her yüklendiğinde NOTFLİX markasını,
  // bizim Giriş/İletişim panellerini ve Forum temizliğini uygula.
  let injectSrc = '';
  try {
    const fontB64 = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', 'BebasNeue.woff2')).toString('base64');
    injectSrc = fs.readFileSync(path.join(__dirname, 'embed-inject.js'), 'utf8').replace('__FONT_B64__', fontB64);
  } catch (e) {}
  // Canlı TV uzak arayüz tema eşleme: sol nav gizle + içeriği sıfıra sıfır oturt + renk paletini bizimkine çevir.
  const canliCss = '.sidebar{display:none!important}.main-inner,.cached-view{padding-left:0!important}:root{--bg0:#0a0a0a!important;--bg1:#141414!important;--bg2:#1a1a1a!important;--bg3:#242424!important;--bg0-rgb:10,10,10!important;--accent:#e50914!important;--accent-rgb:229,9,20!important;--accent-bg:rgba(229,9,20,.1)!important;--primary1:#e50914!important;--primary1-rgb:229,9,20!important;--t1:#ffffff!important;--t2:#b6bcc6!important;--t3:#8a8f98!important;--glass:linear-gradient(180deg,rgba(26,26,26,.82)0%,rgba(20,20,20,.68)50%,rgba(10,10,10,.72)100%)!important;--glass-solid:linear-gradient(180deg,#1f1f1f 0%,#141414 50%,#0a0a0a 100%)!important}';
  if (injectSrc) {
    win.webContents.on('did-frame-finish-load', (_e, isMainFrame, frameProcessId, frameRoutingId) => {
      if (isMainFrame) return;
      try {
        const frame = webFrameMain.fromId(frameProcessId, frameRoutingId);
        if (!frame) return;
        const url = frame.url || '';
        if (/filmmodu\.news/.test(url)) {
          frame.executeJavaScript(injectSrc).then(() => frame.executeJavaScript(
            "JSON.stringify({brand:document.querySelectorAll('.nf-word').length,forum:document.querySelectorAll('a[href*=\"/forum\"]').length,giris:document.querySelectorAll('a[data-nf-panel=\"giris\"]').length,iletisim:document.querySelectorAll('a[data-nf-panel=\"iletisim\"]').length,bagisNav:document.querySelectorAll('#nfBagisNav').length,bagisFooter:document.querySelectorAll('#nfBagisFooter').length,premium:document.querySelectorAll('a[href*=\"/premium\"]').length,canli:document.querySelectorAll('#nfCanliNav').length,report:document.querySelectorAll('.tb-pop').length,react:document.querySelectorAll('[x-data*=\"dislikes\"]').length,yorum:document.querySelectorAll('#yorumlar').length,legal:document.querySelectorAll('[data-nf-legal]').length,telifbox:(document.body.innerText.match(/telifbox/gi)||[]).length,langBtn:document.querySelectorAll('button[aria-label=\"Dil seç\"]').length,fmText:(document.body.innerText.match(/filmmodu/gi)||[]).length,title:document.title})"
          )).then(r => console.log('EMBED-BRAND:', r)).catch(() => {});
        } else if (/131\.123\.43\.89/.test(url)) {
          // Canlı TV uzak arayüzü: sol nav gizle, içerik sıfıra sıfır, renk paleti bizimkiyle aynı.
          frame.executeJavaScript(
            '(function(){var s=document.createElement("style");s.textContent=' + JSON.stringify(canliCss) + ';(document.head||document.documentElement).appendChild(s);return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();})()'
          ).then(a => console.log('CANLI-THEME accent:', a)).catch(() => {});
        }
      } catch (e) {}
    });
  }

  // Native tam ekran köprüsü her modda kayıtlı: player ve Canlı TV gerçek OS tam ekranına geçer.
  ipcMain.on('win:fullscreen', (_e, on) => { try { win.setFullScreen(!!on); } catch (err) {} });

  if (!shotMode) {
    win.maximize();

    // Pencere kontrol köprüsü (çerçevesiz kabuk için sağ üst butonlar)
    ipcMain.on('win:minimize', () => win.minimize());
    ipcMain.on('win:toggle-max', () => { win.isMaximized() ? win.unmaximize() : win.maximize(); });
    ipcMain.on('win:close', () => win.close());
    const pushState = () => win.webContents.send('win:state', { maximized: win.isMaximized() });
    win.on('maximize', pushState);
    win.on('unmaximize', pushState);
    return;
  }

  const shots = path.join(app.getPath('desktop'), 'notflix-shotlar');
  fs.mkdirSync(shots, { recursive: true });
  win.webContents.once('did-finish-load', async () => {
    for (let i = 0; i < 40; i++) {
      const ready = await win.webContents.executeJavaScript('window.__notflixReady === true');
      if (ready) break;
      await new Promise(r => setTimeout(r, 400));
    }
    // Wait for images to finish loading
    await win.webContents.executeJavaScript(`new Promise(r => {
      const imgs = Array.from(document.images);
      if (!imgs.length) return r();
      let pending = imgs.filter(i => !i.complete).length;
      if (!pending) return r();
      imgs.forEach(i => { i.onload = i.onerror = () => { if (--pending <= 0) r(); }; });
      setTimeout(r, 4000);
    })`);
    await new Promise(r => setTimeout(r, 500));
    const totalH = await win.webContents.executeJavaScript('document.documentElement.scrollHeight');
    const bodyH = await win.webContents.executeJavaScript('document.body.scrollHeight');
    const childCount = await win.webContents.executeJavaScript('document.querySelectorAll("#app section").length');
    console.log('scrollHeight:', totalH, 'bodyH:', bodyH, 'sections:', childCount);
    win.focus();
    await new Promise(r => setTimeout(r, 300));
    // Capture shots per theme
    for (const theme of ['site', 'notflix']) {
      await win.webContents.executeJavaScript(`setTema('${theme}')`);
      await new Promise(r => setTimeout(r, 500));
      const total = await win.webContents.executeJavaScript('document.documentElement.scrollHeight');
      const vh = 860;
      const stops = [0, Math.floor((total - vh) * 0.35), Math.floor((total - vh) * 0.7), total - vh];
      for (let s = 0; s < stops.length; s++) {
        await win.webContents.executeJavaScript(`document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, ${stops[s]});`);
        await new Promise(r => setTimeout(r, 500));
        const sy = await win.webContents.executeJavaScript('window.scrollY');
        console.log('theme', theme, 'stop', s, 'target', stops[s], 'actual scrollY', sy);
        const image = await win.webContents.capturePage();
        fs.writeFileSync(path.join(shots, `ekran-${theme}-${s}.png`), image.toPNG());
      }
    }
    // Sayfa bazlı çekimler (site teması): hero fragman, giriş, kayıt, keşfet, takvim, detay
    await win.webContents.executeJavaScript(`setTema('site')`);
    win.maximize();
    await new Promise(res => setTimeout(res, 600));
    const routeShots = [
      { hash: '#/', name: 'anasayfa' },
      { hash: '#/katalog/filmler', name: 'katalog-filmler' },
      { hash: '#/katalog/tur/Komedi', name: 'katalog-tur-komedi' },
      { hash: '#/kesfet', name: 'kesfet' },
      { hash: '#/kesfet-sihirbazi', name: 'kesfet-sihirbazi' },
      { hash: '#/iletisim', name: 'iletisim' },
      { hash: '#/giris', name: 'giris' },
      { hash: '#/canli-tv', name: 'canli-tv' },
      { hash: '#/detay/the-odyssey-2026/film', name: 'film-detay' },
      { hash: '#/detay/the-diplomat/dizi', name: 'dizi-detay' },
      { hash: '#/kutuphane', name: 'kutuphane', seed: true }
    ];
    for (const r of routeShots) {
      if (r.seed) await win.webContents.executeJavaScript(`localStorage.setItem('nf_favs', JSON.stringify([{slug:'the-odyssey-2026',kind:'film',title:'The Odyssey'},{slug:'the-diplomat',kind:'dizi',title:'The Diplomat'}]));`);
      await win.webContents.executeJavaScript(`window.scrollTo(0,0); location.hash='${r.hash.slice(1)}';`);
      await new Promise(res => setTimeout(res, 1600)); // TMDB asenkron zenginleştirme için bekle
      await win.webContents.executeJavaScript(`new Promise(r => { const imgs = Array.from(document.images); let p = imgs.filter(i => !i.complete).length; if (!p) return r(); imgs.forEach(i => { i.onload = i.onerror = () => { if (--p <= 0) r(); }; }); setTimeout(r, 3000); })`);
      if (r.name === 'anasayfa') {
        const hero = await win.webContents.executeJavaScript(`(function(){
          const a = document.querySelector('.slide:not(.hidden)');
          const slot = a && a.querySelector('.trailer-slot');
          return 'activeSlide='+(a?a.dataset.idx:'none')+' totalSlides='+document.querySelectorAll('.slide').length+' heroIframe='+(slot?slot.querySelectorAll('iframe').length:'no-slot')+' slotHidden='+(slot?slot.classList.contains('hidden'):'-');
        })()`);
        console.log('HERO', r.name, '=>', hero);
      }
      if (r.name === 'canli-tv') {
        const chk = await win.webContents.executeJavaScript(`(function(){
          const box = document.getElementById('canliBox');
          const fr = document.getElementById('canliFrame');
          const hd = document.querySelector('header');
          const rect = el => { if(!el) return '-'; const r = el.getBoundingClientRect(); return 'top='+Math.round(r.top)+' bottom='+Math.round(r.bottom)+' h='+Math.round(r.height); };
          return 'header '+rect(hd)+' | box '+rect(box)+' | frame '+rect(fr)+' | vp='+innerHeight;
        })()`);
        console.log('CANLI', '=>', chk);
      }
      if (r.name === 'film-detay' || r.name === 'dizi-detay') {
        await new Promise(res => setTimeout(res, 3000)); // YouTube geçiş kontrol simgeleri kaybolana dek bekle
        const chk = await win.webContents.executeJavaScript(`(function(){
          const bg = document.getElementById('detail-bg-slot');
          const tr = document.getElementById('tmdb-trailer');
          const cast = document.querySelectorAll('#oyuncular img').length;
          const oy = document.getElementById('oyuncular'); const bz = document.getElementById('benzer-rail');
          const order = (oy && bz) ? (oy.compareDocumentPosition(bz) & Node.DOCUMENT_POSITION_FOLLOWING ? 'kadro->benzer(DOGRU)' : 'benzer->kadro(YANLIS)') : (oy?'kadroVAR/benzerYOK':(bz?'kadroYOK/benzerVAR':'ikisiYOK'));
          const cluster = document.querySelectorAll('[data-trailer-host] [data-trailer-mute]').length;
          const desc = (document.getElementById('tmdb-desc')||{}).textContent||'';
          return 'bgIframe='+(bg?bg.querySelectorAll('iframe').length:'no-slot')+' ayriFragmanPlayer='+(tr?'VAR(BOZUK)':'yok')+' rating='+(document.getElementById('tmdb-rating')||{}).textContent+' ozetLen='+desc.length+' kadroImg='+cast+' sira='+order+' fragmanKontrol='+cluster;
        })()`);
        console.log('DETAY', r.name, '=>', chk);
      }
      const image = await win.webContents.capturePage();
      fs.writeFileSync(path.join(shots, `sayfa-${r.name}.png`), image.toPNG());
      console.log('route shot:', r.name);
    }
    // Player tanısı: detayda İzle'ye basınca overlay geliyor mu, ne kapatıyor?
    await win.webContents.executeJavaScript(`window.scrollTo(0,0); location.hash='#/detay/the-odyssey-2026/film';`);
    await new Promise(res => setTimeout(res, 1500));
    const playerChk = await win.webContents.executeJavaScript(`(function(){
      const btn = document.querySelector('[data-play]');
      if (!btn) return 'NO-BUTTON';
      btn.click();
      const ov = document.getElementById('fsPlayer');
      const ctr = ov && ov.querySelector('[data-controls]');
      const xbtn = ov && ov.querySelector('[data-pclose]');
      const rect = el => { if (!el) return '-'; const r = el.getBoundingClientRect(); return Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+','+Math.round(r.height); };
      const cs = el => { if (!el) return '-'; const s = getComputedStyle(el); return 'op='+s.opacity+' pe='+s.pointerEvents+' vis='+s.visibility; };
      return 'fsPlayer='+(!!ov)+' ovZ='+(ov?getComputedStyle(ov).zIndex:'-')
        +' | ctr rect='+rect(ctr)+' '+cs(ctr)
        +' | x rect='+rect(xbtn)+' '+cs(xbtn)
        +' | vp='+innerWidth+'x'+innerHeight;
    })()`);
    console.log('PLAYER', '=>', playerChk);
    await new Promise(res => setTimeout(res, 3200)); // hareketsizlik: auto-hide devreye girsin
    const playerIdle = await win.webContents.executeJavaScript(`(function(){
      const ov = document.getElementById('fsPlayer'); if (!ov) return 'NO-OVERLAY';
      const ctr = ov.querySelector('[data-controls]'); const xbtn = ov.querySelector('[data-pclose]');
      const cs = el => { if (!el) return '-'; const s = getComputedStyle(el); return 'op='+s.opacity+' pe='+s.pointerEvents; };
      return 'IDLE ctr '+cs(ctr)+' | x '+cs(xbtn);
    })()`);
    console.log('PLAYER-IDLE', '=>', playerIdle);
    { const image = await win.webContents.capturePage(); fs.writeFileSync(path.join(shots, 'oyuncu-test.png'), image.toPNG()); }

    // Dropdown açık halleri (tür + dil panelleri)
    await win.webContents.executeJavaScript(`location.hash='#/';`);
    await new Promise(res => setTimeout(res, 600));
    for (const dd of ['turlerDropdown', 'langDropdown']) {
      const info = await win.webContents.executeJavaScript(`(function(){
        document.querySelectorAll('.dd-panel').forEach(p=>{p.classList.add('hidden');p.style.display='';});
        const panel = document.querySelector('#${dd} .dd-panel');
        if(!panel) return 'NO PANEL';
        panel.classList.remove('hidden');
        panel.style.display='block';
        const cs = getComputedStyle(panel);
        const r = panel.getBoundingClientRect();
        return 'display='+cs.display+' rect='+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+','+Math.round(r.height)+' items='+panel.querySelectorAll('a,button').length;
      })()`);
      console.log('DD', dd, '=>', info);
      await new Promise(res => setTimeout(res, 500));
      const image = await win.webContents.capturePage();
      fs.writeFileSync(path.join(shots, `dropdown-${dd}.png`), image.toPNG());
      console.log('dropdown shot:', dd);
    }
    console.log('KAYDEDILDI:', shots);
    app.exit(0);
  });
});

app.on('window-all-closed', () => app.quit());
