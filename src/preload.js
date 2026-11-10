const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const arg = process.argv.find(a => a.startsWith('--notflix-content-path=')) || '';
const udArg = process.argv.find(a => a.startsWith('--notflix-userdata=')) || '';
const userDataDir = udArg.replace('--notflix-userdata=', '');
let content = { hero: { slides: [] }, rails: {}, grids: {}, episodes: {}, details: {}, genres: [], platforms: [] };
let vod = null;
try {
  const p = arg.replace('--notflix-content-path=', '');
  if (p) {
    content = JSON.parse(fs.readFileSync(p, 'utf8'));
    // Scraper'ın tazelediği kopya öncelikli; yoksa paketle gelen temel katalog.
    const up = userDataDir && path.join(userDataDir, 'vod.json');
    const vp = path.join(path.dirname(p), 'vod.json');
    if (up && fs.existsSync(up)) vod = JSON.parse(fs.readFileSync(up, 'utf8'));
    else if (fs.existsSync(vp)) vod = JSON.parse(fs.readFileSync(vp, 'utf8'));
  }
} catch (e) {}

contextBridge.exposeInMainWorld('notflix', {
  content,
  vod,
  version: pkg.version,
  mail: {
    send: (payload) => ipcRenderer.invoke('mail:send', payload)
  },
  stream: {
    resolve: (pageUrl) => ipcRenderer.invoke('stream:resolve', pageUrl)
  },
  data: {
    top250: () => ipcRenderer.invoke('data:top250')
  },
  catalog: {
    onUpdate: (cb) => ipcRenderer.on('catalog:updated', (_e, s) => cb(s))
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    justInstalled: () => ipcRenderer.invoke('update:just-installed'),
    open: (url) => ipcRenderer.invoke('update:open', url),
    download: (url) => ipcRenderer.invoke('update:download', url),
    install: (filePath) => ipcRenderer.invoke('update:install', filePath),
    onProgress: (cb) => ipcRenderer.on('update:progress', (_e, p) => cb(p))
  },
  account: {
    state: () => ipcRenderer.invoke('account:state'),
    login: (p) => ipcRenderer.invoke('account:login', p),
    register: (p) => ipcRenderer.invoke('account:register', p),
    logout: () => ipcRenderer.invoke('account:logout'),
    expire: () => ipcRenderer.invoke('account:expire')
  },
  sub: {
    activate: (code) => ipcRenderer.invoke('sub:activate', code),
    checkout: (productId) => ipcRenderer.invoke('sub:checkout', productId)
  },
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMax: () => ipcRenderer.send('win:toggle-max'),
    close: () => ipcRenderer.send('win:close'),
    fullscreen: (on) => ipcRenderer.send('win:fullscreen', !!on),
    onState: (cb) => ipcRenderer.on('win:state', (_e, s) => cb(s))
  }
});
