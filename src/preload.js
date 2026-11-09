const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const arg = process.argv.find(a => a.startsWith('--notflix-content-path=')) || '';
let content = { hero: { slides: [] }, rails: {}, grids: {}, episodes: {}, details: {}, genres: [], platforms: [] };
let vod = null;
try {
  const p = arg.replace('--notflix-content-path=', '');
  if (p) {
    content = JSON.parse(fs.readFileSync(p, 'utf8'));
    const vp = path.join(path.dirname(p), 'vod.json');
    if (fs.existsSync(vp)) vod = JSON.parse(fs.readFileSync(vp, 'utf8'));
  }
} catch (e) {}

contextBridge.exposeInMainWorld('notflix', {
  content,
  vod,
  version: pkg.version,
  mail: {
    send: (payload) => ipcRenderer.invoke('mail:send', payload)
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    open: (url) => ipcRenderer.invoke('update:open', url)
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
