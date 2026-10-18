const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dinedeckDesktop', {
  isDesktop: true,
  platform: 'windows',
  appVersion: '1.0.0',
  exitApp: () => ipcRenderer.invoke('app:exit'),
  toggleFullScreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),
  isFullScreen: () => ipcRenderer.invoke('app:is-fullscreen')
});
