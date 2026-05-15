const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

const REDIRECT_PORT = 4242;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

module.exports = function (ipcMain, getMainWindow, shell, storageBase) {
  const tokenPath = path.join(storageBase, 'auth', 'token.json');
  const settingsPath = path.join(storageBase, 'settings.json');

  function getSettings() {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }

  function createOAuth2Client() {
    const s = getSettings();
    return new google.auth.OAuth2(s.googleClientId, s.googleClientSecret, REDIRECT_URI);
  }

  function loadTokens(auth) {
    if (!fs.existsSync(tokenPath)) return false;
    const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    auth.setCredentials(tokens);
    // Auto-save refreshed tokens
    auth.on('tokens', (newTokens) => {
      const existing = fs.existsSync(tokenPath)
        ? JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
        : {};
      fs.writeFileSync(tokenPath, JSON.stringify({ ...existing, ...newTokens }, null, 2));
    });
    return true;
  }

  ipcMain.handle('gmail:checkAuth', async () => {
    try {
      const s = getSettings();
      if (!s.googleClientId || !s.googleClientSecret) {
        return { authenticated: false, reason: 'no_credentials' };
      }
      const auth = createOAuth2Client();
      if (!loadTokens(auth)) return { authenticated: false, reason: 'no_token' };
      const gmail = google.gmail({ version: 'v1', auth });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      return { authenticated: true, email: profile.data.emailAddress };
    } catch (err) {
      const message = err?.response?.data?.error_description || err?.response?.data?.error || err?.message || 'unknown';
      return { authenticated: false, reason: 'api_error', detail: message };
    }
  });

  ipcMain.handle('gmail:authenticate', async () => {
    return new Promise((resolve, reject) => {
      const auth = createOAuth2Client();
      const authUrl = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      let server;
      const timeout = setTimeout(() => {
        server?.close();
        reject(new Error('Authentication timed out after 5 minutes'));
      }, 5 * 60 * 1000);

      server = http.createServer(async (req, res) => {
        const parsed = url.parse(req.url, true);
        if (parsed.pathname !== '/callback') {
          res.end();
          return;
        }

        const code = parsed.query.code;
        if (!code) {
          res.writeHead(400);
          res.end('No authorization code received.');
          clearTimeout(timeout);
          server.close();
          reject(new Error('No authorization code'));
          return;
        }

        clearTimeout(timeout);
        server.close();

        try {
          const { tokens } = await auth.getToken(code);
          auth.setCredentials(tokens);
          fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
          fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:60px">
              <h2 style="color:#16a34a">✓ Gmail connected successfully</h2>
              <p>You can close this tab and return to Email Automation.</p>
            </body></html>
          `);
          resolve({ success: true });
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:60px">
              <h2 style="color:#e11d48">✗ Connection failed</h2>
              <p style="color:#64748b">${err.message}</p>
              <p style="color:#64748b">Check that your redirect URI is set to <code>http://localhost:4242/callback</code> and your app type is <strong>Desktop app</strong> in Google Cloud Console.</p>
            </body></html>
          `);
          reject(err);
        }
      });

      server.listen(REDIRECT_PORT, () => {
        shell.openExternal(authUrl);
      });

      server.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  ipcMain.handle('gmail:disconnect', async () => {
    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
    return { success: true };
  });

  ipcMain.handle('gmail:getDrafts', async () => {
    const auth = createOAuth2Client();
    loadTokens(auth);
    const gmail = google.gmail({ version: 'v1', auth });

    const listRes = await gmail.users.drafts.list({ userId: 'me', maxResults: 50 });
    if (!listRes.data.drafts?.length) return [];

    const drafts = await Promise.all(
      listRes.data.drafts.map(async (d) => {
        const detail = await gmail.users.drafts.get({
          userId: 'me',
          id: d.id,
          format: 'full',
        });

        const msg = detail.data.message;
        const headers = msg.payload?.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || '(No subject)';

        const extractBody = (payload) => {
          if (!payload) return '';
          if (payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf8');
          }
          const parts = payload.parts || [];
          const html = parts.find((p) => p.mimeType === 'text/html');
          if (html?.body?.data) return Buffer.from(html.body.data, 'base64').toString('utf8');
          const plain = parts.find((p) => p.mimeType === 'text/plain');
          if (plain?.body?.data) return Buffer.from(plain.body.data, 'base64').toString('utf8');
          // Recurse into multipart
          for (const part of parts) {
            const sub = extractBody(part);
            if (sub) return sub;
          }
          return '';
        };

        return { id: d.id, subject, body: extractBody(msg.payload) };
      })
    );

    return drafts;
  });
};
