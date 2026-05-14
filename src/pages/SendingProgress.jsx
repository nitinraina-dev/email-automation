import { useState, useEffect, useRef } from 'react';
import { StopCircle, CheckCircle2, XCircle, ScrollText, SendHorizonal } from 'lucide-react';

export default function SendingProgress({ navigate, rows, draft, attachmentConfig }) {
  const [status, setStatus] = useState('idle'); // idle | sending | complete | stopped
  const [progress, setProgress] = useState({ current: 0, total: rows.length, sent: 0, failed: 0 });
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const logsEndRef = useRef(null);
  const unsubRef = useRef(null);

  // rows already have `email` key normalised in App.jsx getSelectedRows()
  const buildSendRows = () => rows.map((row) => ({ email: row.email || '' }));

  const startSending = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    setLogs([]);
    setProgress({ current: 0, total: rows.length, sent: 0, failed: 0 });

    // Subscribe to progress events
    unsubRef.current = window.api?.onProgress((data) => {
      setProgress({ current: data.current, total: data.total, sent: data.sent ?? 0, failed: data.failed ?? 0 });
      if (data.email) {
        setLogs((prev) => [
          ...prev,
          {
            email: data.email,
            status: data.status,
            time: new Date().toLocaleTimeString(),
          },
        ]);
      }
      if (data.status === 'complete' || data.status === 'stopped') {
        setStatus(data.status === 'complete' ? 'complete' : 'stopped');
        unsubRef.current?.();
      }
    });

    try {
      const result = await window.api?.startSending({
        rows: buildSendRows(),
        draft,
        attachmentConfig,
      });

      if (result?.error) {
        setError(result.error);
        setStatus('idle');
        unsubRef.current?.();
      }
    } catch (err) {
      setError(err.message);
      setStatus('idle');
      unsubRef.current?.();
    }
  };

  const stopSending = async () => {
    await window.api?.stopSending();
    setStatus('stopped');
  };

  useEffect(() => {
    // Auto-start on mount
    startSending();
    return () => unsubRef.current?.();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isDone = status === 'complete' || status === 'stopped';

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Sending Emails</h1>
          <p className="text-slate-500">Emails are being sent through Gmail.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Main progress card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-slate-900">
                {progress.current}{' '}
                <span className="text-slate-400 text-xl font-normal">/ {progress.total}</span>
              </p>
              <p className="text-slate-500 text-sm mt-0.5">
                {status === 'sending' && 'Sending…'}
                {status === 'complete' && 'All done!'}
                {status === 'stopped' && 'Stopped by user'}
                {status === 'idle' && 'Starting…'}
              </p>
            </div>

            {status === 'sending' && (
              <button
                onClick={stopSending}
                className="flex items-center gap-2 text-sm text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <StopCircle size={16} />
                Stop
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                status === 'complete'
                  ? 'bg-green-500'
                  : status === 'stopped'
                  ? 'bg-amber-400'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex gap-6">
            <StatChip
              icon={<CheckCircle2 size={14} />}
              label="Sent"
              value={progress.sent}
              color="green"
            />
            <StatChip
              icon={<XCircle size={14} />}
              label="Failed"
              value={progress.failed}
              color="red"
            />
            <StatChip
              icon={<span className="text-xs font-bold">{pct}%</span>}
              label="Progress"
              value=""
              color="indigo"
            />
          </div>
        </div>

        {/* Live log */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <ScrollText size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Live Log</h2>
            {status === 'sending' && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-indigo-600">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-auto bg-slate-950 text-xs font-mono p-4 space-y-1">
            {logs.length === 0 && (
              <p className="text-slate-600">Waiting for first email…</p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-600 flex-shrink-0">{log.time}</span>
                {log.status === 'sent' ? (
                  <span className="text-green-400">✓ sent</span>
                ) : log.status === 'sending' ? (
                  <span className="text-indigo-400">→ sending</span>
                ) : (
                  <span className="text-red-400">✗ failed</span>
                )}
                <span className="text-slate-300">{log.email}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Done actions */}
        {isDone && (
          <div
            className={`rounded-xl p-4 mb-5 ${
              status === 'complete' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {status === 'complete' ? (
                <CheckCircle2 size={20} className="text-green-600" />
              ) : (
                <StopCircle size={20} className="text-amber-600" />
              )}
              <div>
                <p className={`font-semibold text-sm ${status === 'complete' ? 'text-green-800' : 'text-amber-800'}`}>
                  {status === 'complete' ? 'Sending complete!' : 'Sending stopped'}
                </p>
                <p className={`text-xs mt-0.5 ${status === 'complete' ? 'text-green-700' : 'text-amber-700'}`}>
                  {progress.sent} sent · {progress.failed} failed
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {isDone && (
            <>
              <button
                onClick={() => navigate('logs')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                <ScrollText size={16} />
                View Full Logs
              </button>
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, color }) {
  const colors = {
    green: 'text-green-600',
    red: 'text-red-500',
    indigo: 'text-indigo-600',
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={colors[color]}>{icon}</span>
      <span className="text-slate-500 text-sm">{label}:</span>
      <span className="font-semibold text-slate-900 text-sm">{value}</span>
    </div>
  );
}
