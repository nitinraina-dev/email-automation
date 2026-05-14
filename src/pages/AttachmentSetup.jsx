import { useState, useEffect } from 'react';
import { FolderOpen, Paperclip, ChevronRight, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

export default function AttachmentSetup({ navigate, config, onChange, rowCount }) {
  const [folderFiles, setFolderFiles] = useState([]);
  const [folderError, setFolderError] = useState('');

  // Refresh file list when folder or config changes
  useEffect(() => {
    if (config.enabled && config.folderPath) {
      window.api?.listFiles(config.folderPath).then((res) => {
        setFolderFiles(res.files || []);
        setFolderError(res.error || '');
      });
    }
  }, [config.enabled, config.folderPath]);

  const handleSelectFolder = async () => {
    const result = await window.api?.selectFolder();
    if (!result?.canceled) {
      onChange({ ...config, folderPath: result.path });
    }
  };

  // Generate preview list of filenames
  const generatePreview = () => {
    if (!config.prefix && !config.extension) return [];
    const count = Math.min(rowCount || 5, 8);
    return Array.from({ length: count }, (_, i) => {
      const num = Number(config.startNumber || 1) + i;
      return `${config.prefix}${num}.${config.extension}`;
    });
  };

  const previewFiles = generatePreview();

  // Check which preview files exist in the folder
  const existingNames = new Set(folderFiles.map((f) => f.name));

  return (
    <div className="p-8">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <span>Step 3</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">Attachments</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Map Attachments</h1>
        <p className="text-slate-500 mb-6">
          Optionally attach a unique local file to each email using sequential naming.
        </p>

        {/* Enable toggle */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
          <button
            onClick={() => onChange({ ...config, enabled: !config.enabled })}
            className="flex items-center gap-3 w-full text-left"
          >
            {config.enabled ? (
              <ToggleRight size={28} className="text-indigo-600 flex-shrink-0" />
            ) : (
              <ToggleLeft size={28} className="text-slate-400 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-slate-900">
                {config.enabled ? 'Attachments enabled' : 'Attachments disabled'}
              </p>
              <p className="text-sm text-slate-500">
                {config.enabled
                  ? 'Each email will include an attachment file.'
                  : 'Emails will be sent without attachments.'}
              </p>
            </div>
          </button>
        </div>

        {config.enabled && (
          <>
            {/* Folder selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
              <h2 className="font-semibold text-slate-900 mb-3">Attachments Folder</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  readOnly
                  value={config.folderPath}
                  placeholder="No folder selected…"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 cursor-default"
                />
                <button
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FolderOpen size={16} />
                  Browse
                </button>
              </div>

              {config.folderPath && (
                <div className="mt-2 text-sm text-slate-500">
                  {folderError ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {folderError}
                    </span>
                  ) : (
                    <span>{folderFiles.length} files found in folder</span>
                  )}
                </div>
              )}
            </div>

            {/* File naming config */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
              <h2 className="font-semibold text-slate-900 mb-1">File Naming Pattern</h2>
              <p className="text-slate-500 text-sm mb-4">
                Files are matched sequentially: Row {Number(config.startNumber || 1)} maps to{' '}
                <code className="bg-slate-100 px-1 rounded text-xs">
                  {config.prefix}{config.startNumber}.{config.extension}
                </code>
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={config.prefix}
                    onChange={(e) => onChange({ ...config, prefix: e.target.value })}
                    placeholder="INV-"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Starting Number</label>
                  <input
                    type="number"
                    min={0}
                    value={config.startNumber}
                    onChange={(e) => onChange({ ...config, startNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Extension</label>
                  <input
                    type="text"
                    value={config.extension}
                    onChange={(e) => onChange({ ...config, extension: e.target.value.replace('.', '') })}
                    placeholder="pdf"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* File preview */}
            {previewFiles.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Paperclip size={16} className="text-slate-400" />
                  <h2 className="font-semibold text-slate-900 text-sm">
                    Generated Filenames Preview (first {previewFiles.length})
                  </h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Row</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Filename</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewFiles.map((name, i) => {
                      const rowNum = i + Number(config.startNumber || 1);
                      const exists = config.folderPath ? existingNames.has(name) : null;
                      return (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-slate-500 text-xs">{rowNum}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-800">{name}</td>
                          <td className="px-4 py-2">
                            {config.folderPath ? (
                              exists ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Found</span>
                              ) : (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">✗ Missing</span>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('template')}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('review')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Next: Final Review
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
