const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateCode: (ast) => ipcRenderer.invoke('generate-code', ast),
  getPorts: () => ipcRenderer.invoke('get-ports'),
  uploadToArduino: (payload) => ipcRenderer.invoke('upload-to-arduino', payload),
});
