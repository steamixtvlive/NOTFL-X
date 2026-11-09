// Marka ikonunu canvas ile tam çözünürlükte üretir (1024 + ICO boyutları).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'build-resources');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 900,
    height: 900,
    show: false,
    frame: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  await win.loadFile(path.join(OUT_DIR, 'icon.html'));
  const ok = await win.webContents.executeJavaScript('window.iconReady');
  if (!ok) throw new Error('Bebas Neue fontu yüklenemedi');

  const write = async (size, name) => {
    const dataUrl = await win.webContents.executeJavaScript(`window.renderIcon(${size})`);
    const b64 = String(dataUrl).split(',')[1];
    const file = path.join(OUT_DIR, name);
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    return { file, size, bytes: fs.statSync(file).size };
  };

  const main = await write(1024, 'icon-1024.png');
  const pngs = [];
  for (const s of SIZES) pngs.push(await write(s, `icon-${s}.png`));

  const pngToIco = (await import('png-to-ico')).default;
  const ico = await pngToIco(pngs.map(p => p.file));
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), ico);

  console.log('ICON-1024:', main.file, main.bytes + ' bayt');
  console.log('ICO:', path.join(OUT_DIR, 'icon.ico'), fs.statSync(path.join(OUT_DIR, 'icon.ico')).size + ' bayt');
  console.log('PNG:', pngs.map(p => p.size + 'px=' + p.bytes + 'B').join(', '));
  app.exit(0);
}).catch(err => { console.error('ICON-ERR:', err); app.exit(1); });
