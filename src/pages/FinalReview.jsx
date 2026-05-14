import { AlertCircle, Mail, Paperclip, FileText, SendHorizonal } from 'lucide-react';

export default function FinalReview({ navigate, authState, rows, draft, attachmentConfig }) {
  const canSend = authState.authenticated && rows.length > 0 && !!draft;

  const previewRows = rows.slice(0, 50);

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Final Review</h1>
          <p className="text-slate-500">Review your send queue before starting.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryCard
            icon={Mail}
            label="Recipients"
            value={rows.length}
            color="indigo"
          />
          <SummaryCard
            icon={FileText}
            label="Template"
            value={draft ? truncate(draft.subject, 22) : 'None selected'}
            color={draft ? 'green' : 'red'}
          />
          <SummaryCard
            icon={Paperclip}
            label="Attachments"
            value={attachmentConfig.enabled ? `Sequential (${attachmentConfig.prefix}*.${attachmentConfig.extension})` : 'None'}
            color={attachmentConfig.enabled ? 'blue' : 'slate'}
          />
        </div>

        {/* Warnings */}
        {!authState.authenticated && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            <AlertCircle size={16} className="flex-shrink-0" />
            Gmail not connected. Go to Settings to authenticate.
          </div>
        )}
        {!draft && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-4">
            <AlertCircle size={16} className="flex-shrink-0" />
            No template selected. Go back to Step 2.
          </div>
        )}
        {rows.length === 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-4">
            <AlertCircle size={16} className="flex-shrink-0" />
            No recipients found. Check your spreadsheet and column selection.
          </div>
        )}

        {/* Email + attachment table */}
        {rows.length > 0 && draft && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">Send Queue</h2>
              <span className="text-xs text-slate-500">
                {rows.length > 50 ? `Showing 50 of ${rows.length}` : `${rows.length} emails`}
              </span>
            </div>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                    {attachmentConfig.enabled && (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachment</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const email = row.email || '—';
                    const attachName = attachmentConfig.enabled
                      ? `${attachmentConfig.prefix}${Number(attachmentConfig.startNumber) + i}.${attachmentConfig.extension}`
                      : null;
                    return (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2 text-slate-800 font-medium">{email}</td>
                        <td className="px-4 py-2 text-slate-600 text-xs truncate max-w-xs">{draft.subject}</td>
                        {attachmentConfig.enabled && (
                          <td className="px-4 py-2">
                            <span className="font-mono text-xs text-slate-600">{attachName}</span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && (
              <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                + {rows.length - 50} more rows
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('attachment')}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={() => navigate('sending')}
            disabled={!canSend}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <SendHorizonal size={18} />
            Start Sending {rows.length} Email{rows.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-400',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-slate-900 font-semibold mt-0.5 text-sm leading-tight">{value}</p>
    </div>
  );
}

function truncate(str, n) {
  return str && str.length > n ? str.slice(0, n) + '…' : str;
}
