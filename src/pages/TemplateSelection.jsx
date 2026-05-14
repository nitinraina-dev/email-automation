import { useState, useEffect } from 'react';
import { RefreshCw, Mail, ChevronRight, AlertCircle, FileText } from 'lucide-react';

export default function TemplateSelection({ navigate, authState, selectedDraft, onDraftSelect }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDrafts = async () => {
    if (!authState.authenticated) {
      setError('Connect your Gmail account first in Settings.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await window.api?.getDrafts();
      setDrafts(result || []);
      if (!result?.length) setError('No drafts found in your Gmail account. Create a draft to use as a template.');
    } catch (err) {
      setError(`Failed to load drafts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.authenticated && !drafts.length) fetchDrafts();
  }, [authState.authenticated]);

  return (
    <div className="p-8">
      <div className="max-w-4xl flex gap-6">
        {/* Left: draft list */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>Step 2</span>
            <ChevronRight size={14} />
            <span className="text-slate-900 font-medium">Select Template</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Choose Email Template</h1>
          <p className="text-slate-500 mb-4">
            Select a Gmail Draft to use as your email template.
          </p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">{drafts.length} drafts found</span>
            <button
              onClick={fetchDrafts}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading…' : 'Refresh Drafts'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Draft list */}
          <div className="space-y-2 mb-6">
            {loading && !drafts.length ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading drafts…
              </div>
            ) : drafts.length === 0 && !loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No drafts loaded. Click "Refresh Drafts" to fetch from Gmail.</p>
              </div>
            ) : (
              drafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => onDraftSelect(draft)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedDraft?.id === draft.id
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Mail
                      size={18}
                      className={selectedDraft?.id === draft.id ? 'text-indigo-600' : 'text-slate-400'}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${
                          selectedDraft?.id === draft.id ? 'text-indigo-900' : 'text-slate-900'
                        }`}
                      >
                        {draft.subject}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {stripHtml(draft.body).slice(0, 80)}
                      </p>
                    </div>
                    {selectedDraft?.id === draft.id && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => navigate('sheet')}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate('attachment')}
              disabled={!selectedDraft}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              Next: Attachments
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: preview panel */}
        {selectedDraft && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-8">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Template Preview</h3>
              <div className="mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Subject</p>
                <p className="text-sm text-slate-900 font-medium">{selectedDraft.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Body</p>
                <div
                  className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 max-h-64 overflow-auto border border-slate-100"
                  dangerouslySetInnerHTML={{ __html: selectedDraft.body || '<em>No body</em>' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
