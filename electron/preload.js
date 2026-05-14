const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // File operations
  selectFile: () => ipcRenderer.invoke('files:selectFile'),
  selectFolder: () => ipcRenderer.invoke('files:selectFolder'),
  listFiles: (folderPath) => ipcRenderer.invoke('files:listFiles', folderPath),

  // Excel
  parseExcel: (filePath) => ipcRenderer.invoke('excel:parse', filePath),

  // Gmail Auth
  checkAuth: () => ipcRenderer.invoke('gmail:checkAuth'),
  authenticate: () => ipcRenderer.invoke('gmail:authenticate'),
  disconnect: () => ipcRenderer.invoke('gmail:disconnect'),

  // Gmail Drafts
  getDrafts: () => ipcRenderer.invoke('gmail:getDrafts'),

  // Sender
  startSending: (config) => ipcRenderer.invoke('sender:start', config),
  stopSending: () => ipcRenderer.invoke('sender:stop'),

  // Logs
  getLogs: () => ipcRenderer.invoke('logs:get'),
  clearLogs: () => ipcRenderer.invoke('logs:clear'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Event subscription — returns an unsubscribe function
  onProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('sender:progress', handler);
    return () => ipcRenderer.removeListener('sender:progress', handler);
  },
});
