import { useState } from 'react';
import { Upload, FileSpreadsheet, ChevronRight, AlertCircle } from 'lucide-react';

export default function SheetPreview({ navigate, sheetFile, onSheetLoad, emailConfig, onEmailConfigChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectFile = async () => {
    setError('');
    const fileResult = await window.api?.selectFile();
    if (fileResult?.canceled) return;

    setLoading(true);
    try {
      const parsed = await window.api?.parseExcel(fileResult.path);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      onSheetLoad({ path: fileResult.path, headers: parsed.headers, rows: parsed.rows });
      // Auto-select first column that looks like email
      const emailCol = parsed.headers.find((h) =>
        h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')
      );
      if (emailCol && !emailConfig.column) {
        onEmailConfigChange({ ...emailConfig, column: emailCol, endRow: parsed.rows.length + 1 });
      } else {
        onEmailConfigChange({ ...emailConfig, endRow: parsed.rows.length + 1 });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRows = getFilteredRows(sheetFile, emailConfig);
  const previewRows = sheetFile ? sheetFile.rows.slice(0, 8) : [];

  const canProceed = sheetFile && emailConfig.column && selectedRows.length > 0;

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <span>Step 1</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">Upload Spreadsheet</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Load Your Email List</h1>
        <p className="text-slate-500 mb-6">Upload an Excel or CSV file containing your recipients.</p>

        {/* Upload area */}
        <div
          onClick={handleSelectFile}
          className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all mb-6"
        >
          {loading ? (
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Parsing file…</span>
            </div>
          ) : sheetFile ? (
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={28} className="text-green-500" />
              <div>
                <p className="font-medium text-slate-900">{sheetFile.path.split('/').pop()}</p>
                <p className="text-sm text-slate-500">
                  {sheetFile.rows.length} rows · {sheetFile.headers.length} columns — click to replace
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={32} className="text-slate-400 mb-3" />
              <p className="text-slate-700 font-medium">Click to select a spreadsheet</p>
              <p className="text-slate-400 text-sm mt-1">Supports .xlsx, .xls, .csv</p>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Column & row config */}
        {sheetFile && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
              <h2 className="font-semibold text-slate-900 mb-4">Configure Selection</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={emailConfig.column}
                    onChange={(e) => onEmailConfigChange({ ...emailConfig, column: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select column…</option>
                    {sheetFile.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Row</label>
                  <input
                    type="number"
                    min={2}
                    max={sheetFile.rows.length + 1}
                    value={emailConfig.startRow}
                    onChange={(e) => onEmailConfigChange({ ...emailConfig, startRow: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Row 1 = header</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Row</label>
                  <input
                    type="number"
                    min={2}
                    max={sheetFile.rows.length + 1}
                    value={emailConfig.endRow}
                    onChange={(e) => onEmailConfigChange({ ...emailConfig, endRow: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {emailConfig.column && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedRows.length > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedRows.length} recipient{selectedRows.length !== 1 ? 's' : ''} selected
                  </span>
                  {selectedRows.length === 0 && (
                    <span className="text-slate-500">No valid email addresses in selected range</span>
                  )}
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-sm">Preview (first 8 rows)</h2>
                <span className="text-xs text-slate-500">Total: {sheetFile.rows.length} data rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                        Row
                      </th>
                      {sheetFile.headers.map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider ${
                            h === emailConfig.column
                              ? 'text-indigo-600 bg-indigo-50'
                              : 'text-slate-500'
                          }`}
                        >
                          {h}
                          {h === emailConfig.column && (
                            <span className="ml-1 text-indigo-400 normal-case">✓ email</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-400 text-xs">{row._rowNum}</td>
                        {sheetFile.headers.map((h) => (
                          <td
                            key={h}
                            className={`px-4 py-2 ${
                              h === emailConfig.column ? 'font-medium text-indigo-700' : 'text-slate-700'
                            }`}
                          >
                            {row[h] || <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Next */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('template')}
            disabled={!canProceed}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Next: Select Template
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function getFilteredRows(sheetFile, emailConfig) {
  if (!sheetFile || !emailConfig.column) return [];
  const startIdx = Math.max(0, Number(emailConfig.startRow || 2) - 2);
  const endIdx = emailConfig.endRow ? Number(emailConfig.endRow) - 1 : sheetFile.rows.length;
  return sheetFile.rows
    .slice(startIdx, endIdx)
    .filter((r) => r[emailConfig.column]?.trim());
}
