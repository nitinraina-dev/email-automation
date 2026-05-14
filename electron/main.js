const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

// Storage paths — userData in production, local storage/ in dev
const storageBase = isDev
  ? path.join(__dirname, '..', 'storage')
  : path.join(app.getPath('userData'), 'storage');

const authDir = path.join(storageBase, 'auth');
const tempDir = isDev ? path.join(__dirname, '..', 'temp') : path.join(app.getPath('userData'), 'temp');

function ensureDirs() {
  [storageBase, authDir, tempDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const settingsPath = path.join(storageBase, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ googleClientId: '', googleClientSecret: '', delay: 2500 }, null, 2)
    );
  }

  const logsPath = path.join(storageBase, 'logs.json');
  if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, '[]');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'default',
    title: 'Email Automation',
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ensureDirs();
  createWindow();

  const getMainWindow = () => mainWindow;
  const settingsPath = path.join(storageBase, 'settings.json');

  // Register IPC modules
  require('./ipc/gmail')(ipcMain, getMainWindow, shell, storageBase);
  require('./ipc/files')(ipcMain, dialog);
  require('./ipc/excel')(ipcMain);
  require('./ipc/sender')(ipcMain, getMainWindow, storageBase);

  // Settings
  ipcMain.handle('settings:get', () => JSON.parse(fs.readFileSync(settingsPath, 'utf8')));
  ipcMain.handle('settings:save', (_e, settings) => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
