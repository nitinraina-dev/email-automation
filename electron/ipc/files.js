const fs = require('fs');
const path = require('path');

module.exports = function (ipcMain, dialog) {
  ipcMain.handle('files:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Spreadsheet',
      properties: ['openFile'],
      filters: [{ name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }],
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('files:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Attachments Folder',
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('files:listFiles', async (_e, folderPath) => {
    try {
      const entries = fs.readdirSync(folderPath);
      const files = entries
        .filter((name) => !name.startsWith('.'))
        .map((name) => {
          const full = path.join(folderPath, name);
          const stat = fs.statSync(full);
          return { name, path: full, size: stat.size, isFile: stat.isFile() };
        })
        .filter((f) => f.isFile);
      return { files };
    } catch (err) {
      return { files: [], error: err.message };
    }
  });
};
