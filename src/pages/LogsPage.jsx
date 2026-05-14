import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await window.api?.getLogs();
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = async () => {
    if (!confirm('Clear all logs? This cannot be undone.')) return;
    setClearing(true);
    await window.api?.clearLogs();
    setLogs([]);
    setClearing(false);
  };

  const handleExport = () => {
    const rows = [['Email', 'Attachment', 'Status', 'Error', 'Timestamp']];
    logs.forEach((l) => rows.push([l.email, l.file || '', l.status, l.error || '', l.timestamp]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.status === filter);
  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Send Logs</h1>
            <p className="text-slate-500">History of all sent and failed emails.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {logs.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={14} />
                Export CSV
              </button>
            )}
            {logs.length > 0 && (
              <button
                onClick={handleClear}
                disabled={clearing}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-5">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="text-slate-500 text-sm">Total:</span>
            <span className="font-semibold text-slate-900 text-sm">{logs.length}</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="text-green-700 text-sm">Sent: <strong>{sentCount}</strong></span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <XCircle size={14} className="text-red-500" />
            <span className="text-red-700 text-sm">Failed: <strong>{failedCount}</strong></span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
          {['all', 'sent', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Clock size={32} className="mb-3" />
              <p className="font-medium">{logs.length === 0 ? 'No logs yet' : 'No matching logs'}</p>
              <p className="text-sm">Send emails to see logs here</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachment</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        {log.status === 'sent' ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                            <CheckCircle2 size={11} /> Sent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full w-fit">
                            <XCircle size={11} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium">{log.email}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">
                        {log.file || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-red-500 text-xs max-w-xs truncate">
                        {log.error || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
