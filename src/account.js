// NOTFLİX hesap + abonelik katmanı (yerel, Supabase öncesi).
// Giriş/kayıt yerel bir JSON dosyasında tutulur; abonelik Shopier sipariş koduyla etkinleştirilir.
// Shopier API anahtarı yalnızca bu ana süreçte durur, arayüze sızmaz.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app, ipcMain, shell } = require('electron');

const SHOPIER_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI1ZjhiNmI0YTI5MDM1YjE5ODk3ZWQxMjNkYWFhMDQ5MyIsImp0aSI6IjlkZWNkZTYwNGRlYTJmOWYyN2I0ZDYxNzRhZDgxZTI3NDVmZjIwMzAzYTdhMDliZmZjYzlkZGJjNDkyNGNlMjRmZTY4ZDczMGJmNTczZGMyNjhkYjc3NmI2ZjYxZDU1ZTFlM2I3ZDk0ZDdlYTE1MmQ0ZjM0MjczYjc5MzEwYmMzOTg0ZTkxZjBhNjVkYjgwNjkwNDE4MWMxZjE2NmU5MzQiLCJpYXQiOjE3OTQyMTY4OTgsIm5iZiI6MTc5NDIxNjg5OCwiZXhwIjoxOTUyMDAxNjU4LCJzdWIiOjI1MDk2OTYsInNjb3BlcyI6WyJvcmRlcnM6cmVhZCIsIm9yZGVyczp3cml0ZSIsInByb2R1Y3RzOnJlYWQiLCJwcm9kdWN0czp3cml0ZSIsInNoaXBwaW5nczpyZWFkIiwic2hpcHBpbmdzOndyaXRlIiwiZGlzY291bnRzOnJlYWQiLCJkaXNjb3VudHM6d3JpdGUiLCJwYXlvdXRzOnJlYWQiLCJyZWZ1bmRzOnJlYWQiLCJyZWZ1bmRzOndyaXRlIiwic2hvcDpyZWFkIiwic2hvcDp3cml0ZSJdfQ.PjydMttMmnmgKGmVocf1Kt-TTGR_LlTIl_i8m0uDr9FTLc8o61alynE5gXvWGXTE0bn48R9PkMdywpwliHDo6t5Vqo_oQpxpKJc01CFQ_wKzdEXM8H4n5kHHE1UQAf4NquQwFpa-3cgEoBeXHaMSRzkPq-yS-6oRIAm4wN0ceDC1_Rdxpf78R1GbCxGB3Wgr-61rdRi_Oqmt1y-YgrIS_AS21X492c2AohCJnDkkiSsePn6XD15GyhG675NJZpjn0VyiHSVnh2zSHd1w9dBqO9zwXs3eIcMLAjTWxayyCNbN9xyN0LmtIkkBD9MXUUeaguyromZx1kL07mbtKoDTwg';

// Shopier ürün kimliği → paket süresi (gün). Ödeme sayfası linkleriyle birebir.
const PACKAGES = {
  '49623989': { id: '49623989', label: '1 Aylık Premium', months: 1, days: 30, price: 150, url: 'https://www.shopier.com/platool/49623989' },
  '49624003': { id: '49624003', label: '3 Aylık Premium', months: 3, days: 90, price: 300, url: 'https://www.shopier.com/platool/49624003', badge: 'Popüler', badgeSub: 'Dengeli seçim' },
  '49624023': { id: '49624023', label: '6 Aylık Premium', months: 6, days: 180, price: 600, url: 'https://www.shopier.com/platool/49624023', badge: 'En avantajlı', badgeSub: 'En uzun deneyim' }
};

const BAD_WORDS = ['amk', 'aq', 'orospu', 'pic', 'piç', 'sik', 'sikis', 'sikiş', 'yarrak', 'got', 'göt', 'meme', 'sex', 'porno', 'porn', 'fuck', 'shit', 'bitch', 'amcik', 'amcık', 'tasak', 'taşak', 'dalyarak', 'pezevenk', 'kaltak', 'surtuk', 'sürtük', 'ibne', 'gavat', 'kahpe', 'hasiktir', 'siktir'];

let store = null;
let storePath = null;

function load() {
  storePath = path.join(app.getPath('userData'), 'notflix-account.json');
  try { store = JSON.parse(fs.readFileSync(storePath, 'utf8')); } catch (e) { store = null; }
  if (!store || typeof store !== 'object') store = { users: {}, usedCodes: {}, session: null };
  store.users = store.users || {};
  store.usedCodes = store.usedCodes || {};
  // Bootstrap test kullanıcısı (kayıt kurallarından muaf, yalnızca ilk kurulum).
  if (!store.users['1234']) {
    store.users['1234'] = { username: '1234', email: 'test@notflix.local', pass: hash('1234', 'notflix'), createdAt: Date.now(), block: 0, subscription: null, test: true };
    save();
  }
}
function save() { try { fs.writeFileSync(storePath, JSON.stringify(store, null, 2)); } catch (e) {} }
function hash(pass, salt) { return crypto.createHash('sha256').update(salt + ':' + pass).digest('hex'); }

function validUsername(u) {
  if (typeof u !== 'string' || u.length < 12 || u.length > 18) return 'Kullanıcı adı 12–18 karakter olmalı.';
  if (!/^[a-zA-Z0-9_.\-çğıöşüÇĞİÖŞÜ]+$/.test(u)) return 'Kullanıcı adı yalnızca harf, rakam ve _ . - içerebilir.';
  const low = u.toLowerCase();
  if (BAD_WORDS.some(w => low.includes(w))) return 'Bu kullanıcı adı uygun değil. Lütfen başka bir ad seç.';
  return null;
}
function validPassword(p) {
  if (typeof p !== 'string' || p.length < 9 || p.length > 12) return 'Şifre 9–12 karakter olmalı.';
  return null;
}
function validEmail(e) {
  if (typeof e !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Geçerli bir e-posta gir.';
  return null;
}

function subState(user) {
  const s = user && user.subscription;
  if (!s || !s.expiresAt) return { active: false };
  const now = Date.now();
  const active = s.expiresAt > now;
  const total = s.expiresAt - s.startedAt;
  const left = Math.max(0, s.expiresAt - now);
  return {
    active,
    package: s.package,
    productId: s.productId,
    label: s.label,
    trial: !!s.trial,
    startedAt: s.startedAt,
    expiresAt: s.expiresAt,
    daysLeft: Math.ceil(left / 86400000),
    msLeft: left,
    progress: total > 0 ? Math.min(1, Math.max(0, (now - s.startedAt) / total)) : 0
  };
}
function currentUser() {
  const sess = store.session;
  if (sess && sess.username && store.users[sess.username]) return store.users[sess.username];
  return null;
}
function publicState() {
  const u = currentUser();
  if (!u) return { loggedIn: false, packages: Object.values(PACKAGES) };
  return {
    loggedIn: true,
    remember: !!(store.session && store.session.remember),
    user: { username: u.username, email: u.email, createdAt: u.createdAt, block: u.block || 0 },
    subscription: subState(u),
    packages: Object.values(PACKAGES)
  };
}

function init() {
  load();

  ipcMain.handle('account:state', () => publicState());

  ipcMain.handle('account:login', (_e, p) => {
    p = p || {};
    const username = String(p.username || '').trim();
    const password = String(p.password || '');
    const u = store.users[username];
    if (!u || u.pass !== hash(password, username === '1234' ? 'notflix' : u.username)) {
      return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' };
    }
    if (u.block === 1) return { ok: false, error: 'Bu hesaptan yasaklandınız. Yeni bir hesap açabilirsiniz.' };
    store.session = { username: u.username, remember: !!p.remember };
    save();
    return { ok: true, state: publicState() };
  });

  ipcMain.handle('account:register', (_e, p) => {
    p = p || {};
    const username = String(p.username || '').trim();
    const email = String(p.email || '').trim();
    const password = String(p.password || '');
    const err = validUsername(username) || validEmail(email) || validPassword(password);
    if (err) return { ok: false, error: err };
    if (store.users[username]) return { ok: false, error: 'Bu kullanıcı adı zaten alınmış.' };
    store.users[username] = { username, email, pass: hash(password, username), createdAt: Date.now(), block: 0, subscription: null };
    store.session = { username, remember: !!p.remember };
    save();
    return { ok: true, state: publicState() };
  });

  ipcMain.handle('account:logout', () => { store.session = null; save(); return { ok: true, state: publicState() }; });

  // Abonelik süresi sona erince oturumu düşür (arayüz giriş ekranına döner).
  ipcMain.handle('account:expire', () => {
    const u = currentUser();
    if (u && u.subscription && u.subscription.expiresAt <= Date.now()) {
      u.subscription = null; save();
    }
    return { ok: true, state: publicState() };
  });

  // Shopier sipariş kodu (sipariş numarası) ile abonelik etkinleştirme.
  ipcMain.handle('sub:activate', async (_e, codeRaw) => {
    const u = currentUser();
    if (!u) return { ok: false, error: 'Önce giriş yapmalısın.' };
    const code = String(codeRaw || '').trim().replace(/[^0-9]/g, '');
    if (!code) return { ok: false, error: 'Lütfen Shopier sipariş kodunu gir.' };
    if (store.usedCodes[code]) return { ok: false, error: 'Bu Shopier kodu daha önce kullanıldı. Lütfen yeni bir abonelik satın al.' };
    let order;
    try {
      const r = await fetch('https://api.shopier.com/v1/orders/' + encodeURIComponent(code), {
        headers: { Authorization: 'Bearer ' + SHOPIER_KEY, Accept: 'application/json' }
      });
      if (r.status === 404) return { ok: false, error: 'Bu kodla bir sipariş bulunamadı. Kodu kontrol et.' };
      if (!r.ok) return { ok: false, error: 'Shopier sorgusu başarısız (' + r.status + '). Biraz sonra tekrar dene.' };
      order = await r.json();
    } catch (err) {
      return { ok: false, error: 'Shopier bağlantısı kurulamadı. İnternetini kontrol et.' };
    }
    if (!order || String(order.paymentStatus) !== 'paid') return { ok: false, error: 'Bu siparişin ödemesi tamamlanmamış görünüyor.' };
    const items = Array.isArray(order.lineItems) ? order.lineItems : [];
    const item = items.find(it => PACKAGES[String(it.productId)]);
    if (!item) return { ok: false, error: 'Bu sipariş bir NOTFLİX abonelik paketi içermiyor.' };
    const pkg = PACKAGES[String(item.productId)];
    const now = Date.now();
    u.subscription = { package: pkg.id, productId: pkg.id, label: pkg.label, code, startedAt: now, expiresAt: now + pkg.days * 86400000, trial: false };
    store.usedCodes[code] = { username: u.username, productId: pkg.id, activatedAt: now };
    save();
    return { ok: true, state: publicState(), subscription: subState(u) };
  });

  // Ödeme sayfasını varsayılan tarayıcıda aç.
  ipcMain.handle('sub:checkout', (_e, productId) => {
    const pkg = PACKAGES[String(productId)];
    if (pkg) shell.openExternal(pkg.url);
    return { ok: !!pkg };
  });

  return { publicState, currentUser };
}

module.exports = { init, PACKAGES };