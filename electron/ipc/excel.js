const xlsx = require('xlsx');

module.exports = function (ipcMain) {
  ipcMain.handle('excel:parse', async (_e, filePath) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // header: 1 returns array-of-arrays
      const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!raw || raw.length === 0) return { headers: [], rows: [], error: 'File is empty' };

      const headers = raw[0].map((h, i) => (h !== '' ? String(h) : `Column ${i + 1}`));

      const rows = raw.slice(1).map((row, idx) => {
        const obj = { _rowNum: idx + 2 }; // Excel row number (1-indexed, row 1 = header)
        headers.forEach((h, j) => {
          obj[h] = row[j] !== undefined ? String(row[j]) : '';
        });
        return obj;
      });

      return { headers, rows };
    } catch (err) {
      return { headers: [], rows: [], error: err.message };
    }
  });
};
