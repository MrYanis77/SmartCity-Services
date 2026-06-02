const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node:     () => process.versions.node,
    chrome:   () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
  apiUrl: 'http://localhost:3000',
});

contextBridge.exposeInMainWorld('ipcBridge', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
