import { useState, useEffect } from 'react';
import { Save, ExternalLink, CheckCircle2, LogOut, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage({ authState, onAuthChange }) {
  const [settings, setSettings] = useState({ googleClientId: '', googleClientSecret: '', delay: 2500 });
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    window.api?.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    setError('');
    const result = await window.api?.saveSettings(settings);
    if (result?.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleConnect = async () => {
    if (!settings.googleClientId || !settings.googleClientSecret) {
      setError('Please enter and save your Google Client ID and Client Secret first.');
      return;
    }
    setError('');
    setConnecting(true);
    try {
      await window.api?.saveSettings(settings);
      const result = await window.api?.authenticate();
      if (result?.success) {
        const authCheck = await window.api?.checkAuth();
        if (authCheck.authenticated) {
          onAuthChange({ authenticated: true, email: authCheck.email || '' });
        } else {
          const detail = authCheck.detail ? ` (${authCheck.detail})` : '';
          setError(`Token saved but Gmail API check failed${detail}. Make sure the Gmail API is enabled in your Google Cloud project.`);
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await window.api?.disconnect();
    onAuthChange({ authenticated: false, email: '' });
    setDisconnecting(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your Gmail OAuth credentials and sending preferences.</p>
      </div>

      {/* Gmail Connection Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">Gmail Account</h2>
        {authState.authenticated ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Connected</p>
                <p className="text-sm text-slate-500">{authState.email}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {disconnecting ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
              Disconnect
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-3">No Gmail account connected.</p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {connecting ? <RefreshCw size={14} className="animate-spin" /> : null}
              {connecting ? 'Opening browser…' : 'Connect Gmail Account'}
            </button>
          </div>
        )}
      </div>

      {/* Google OAuth Credentials */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-slate-900">Google OAuth Credentials</h2>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Open in system browser — no window.open in Electron renderer with CSP
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Google Cloud Console
          </a>
        </div>

        {/* Setup guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs text-slate-600 space-y-1">
          <p className="font-medium text-slate-700">How to get credentials:</p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>Go to console.cloud.google.com → Create project</li>
            <li>Enable the <strong>Gmail API</strong></li>
            <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
            <li>Application type: <strong>Desktop app</strong></li>
            <li>Add authorized redirect URI: <code className="bg-white border px-1 rounded">http://localhost:4242/callback</code></li>
            <li>Copy Client ID and Client Secret below</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Client ID</label>
            <input
              type="text"
              value={settings.googleClientId}
              onChange={(e) => setSettings({ ...settings, googleClientId: e.target.value })}
              placeholder="123456789-xxxx.apps.googleusercontent.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Client Secret</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={settings.googleClientSecret}
                onChange={(e) => setSettings({ ...settings, googleClientSecret: e.target.value })}
                placeholder="GOCSPX-…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sending Preferences */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">Sending Preferences</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Delay between emails (ms)
          </label>
          <input
            type="number"
            min={500}
            max={30000}
            step={100}
            value={settings.delay}
            onChange={(e) => setSettings({ ...settings, delay: Number(e.target.value) })}
            className="w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Recommended: 2500ms (2.5s) to avoid Gmail rate limiting
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
      >
        {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
