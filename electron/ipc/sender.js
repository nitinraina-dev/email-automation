const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const REDIRECT_URI = 'http://localhost:4242/callback';

module.exports = function (ipcMain, getMainWindow, storageBase) {
  const tokenPath = path.join(storageBase, 'auth', 'token.json');
  const settingsPath = path.join(storageBase, 'settings.json');
  const logsPath = path.join(storageBase, 'logs.json');
  const failedPath = path.join(storageBase, 'failed.json');

  let isSending = false;
  let shouldStop = false;

  function getSettings() {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }

  function createAuth() {
    const s = getSettings();
    const auth = new google.auth.OAuth2(s.googleClientId, s.googleClientSecret, REDIRECT_URI);
    const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    auth.setCredentials(tokens);
    auth.on('tokens', (t) => {
      const existing = fs.existsSync(tokenPath)
        ? JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
        : {};
      fs.writeFileSync(tokenPath, JSON.stringify({ ...existing, ...t }, null, 2));
    });
    return auth;
  }

  function appendLog(entry) {
    const logs = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf8')) : [];
    logs.unshift(entry);
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
  }

  function appendFailed(entry) {
    const failed = fs.existsSync(failedPath) ? JSON.parse(fs.readFileSync(failedPath, 'utf8')) : [];
    failed.push(entry);
    fs.writeFileSync(failedPath, JSON.stringify(failed, null, 2));
  }

  function buildRaw({ to, subject, htmlBody, attachment }) {
    const boundary = `EA_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const encBody = Buffer.from(htmlBody || '<p></p>').toString('base64');

    let mime =
      `To: ${to}\r\n` +
      `Subject: =?UTF-8?B?${Buffer.from(subject || '').toString('base64')}?=\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/mixed; boundary="${boundary}"\r\n` +
      `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset=UTF-8\r\n` +
      `Content-Transfer-Encoding: base64\r\n` +
      `\r\n` +
      `${encBody}\r\n`;

    if (attachment) {
      mime +=
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/octet-stream; name="${attachment.name}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n` +
        `Content-Disposition: attachment; filename="${attachment.name}"\r\n` +
        `\r\n` +
        `${attachment.data}\r\n`;
    }

    mime += `\r\n--${boundary}--`;
    return Buffer.from(mime).toString('base64url');
  }

  ipcMain.handle('sender:start', async (_e, { rows, draft, attachmentConfig }) => {
    if (isSending) return { error: 'Already sending' };

    isSending = true;
    shouldStop = false;

    const settings = getSettings();
    const delay = settings.delay || 2500;
    const total = rows.length;
    let sent = 0;
    let failed = 0;

    let auth, gmail;
    try {
      auth = createAuth();
      gmail = google.gmail({ version: 'v1', auth });
    } catch (err) {
      isSending = false;
      return { error: `Auth failed: ${err.message}` };
    }

    const emit = (data) => {
      getMainWindow()?.webContents.send('sender:progress', data);
    };

    for (let i = 0; i < rows.length; i++) {
      if (shouldStop) break;

      const row = rows[i];
      const email = row.email;

      emit({ current: i + 1, total, email, status: 'sending', sent, failed });

      try {
        let attachment = null;
        if (attachmentConfig?.enabled && attachmentConfig.folderPath) {
          const filename = `${attachmentConfig.prefix}${Number(attachmentConfig.startNumber) + i}.${attachmentConfig.extension}`;
          const filePath = path.join(attachmentConfig.folderPath, filename);
          if (fs.existsSync(filePath)) {
            attachment = {
              name: filename,
              data: fs.readFileSync(filePath).toString('base64'),
            };
          }
        }

        const raw = buildRaw({
          to: email,
          subject: draft.subject,
          htmlBody: draft.body,
          attachment,
        });

        await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

        sent++;
        const entry = {
          email,
          file: attachment?.name || null,
          status: 'sent',
          timestamp: new Date().toISOString(),
        };
        appendLog(entry);
        emit({ current: i + 1, total, email, status: 'sent', sent, failed });
      } catch (err) {
        failed++;
        const filename = attachmentConfig?.enabled
          ? `${attachmentConfig.prefix}${Number(attachmentConfig.startNumber) + i}.${attachmentConfig.extension}`
          : null;
        const entry = {
          email,
          file: filename,
          status: 'failed',
          error: err.message,
          timestamp: new Date().toISOString(),
        };
        appendLog(entry);
        appendFailed(entry);
        emit({ current: i + 1, total, email, status: 'failed', sent, failed });
      }

      if (i < rows.length - 1 && !shouldStop) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    isSending = false;
    emit({ current: shouldStop ? sent + failed : total, total, status: 'complete', sent, failed });
    return { success: true, sent, failed };
  });

  ipcMain.handle('sender:stop', async () => {
    shouldStop = true;
    return { success: true };
  });

  ipcMain.handle('logs:get', async () => {
    if (!fs.existsSync(logsPath)) return [];
    return JSON.parse(fs.readFileSync(logsPath, 'utf8'));
  });

  ipcMain.handle('logs:clear', async () => {
    fs.writeFileSync(logsPath, '[]');
    if (fs.existsSync(failedPath)) fs.writeFileSync(failedPath, '[]');
    return { success: true };
  });
};
