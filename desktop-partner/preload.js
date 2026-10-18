const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dinedeckDesktop', {
  isDesktop: true,
  platform: 'windows',
  appVersion: '1.0.0',
  getPrinters: () => ipcRenderer.invoke('printer:get-printers'),
  printReceipt: (payload) => ipcRenderer.invoke('printer:print-receipt', payload),
  exitApp: () => ipcRenderer.invoke('app:exit'),
  toggleFullScreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),
  isFullScreen: () => ipcRenderer.invoke('app:is-fullscreen')
});
