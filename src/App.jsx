import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SheetPreview from './pages/SheetPreview';
import TemplateSelection from './pages/TemplateSelection';
import AttachmentSetup from './pages/AttachmentSetup';
import FinalReview from './pages/FinalReview';
import SendingProgress from './pages/SendingProgress';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

const defaultAttachmentConfig = {
  enabled: false,
  folderPath: '',
  prefix: 'INV-',
  startNumber: 1,
  extension: 'pdf',
};

export default function App() {
  const [page, setPage] = useState('dashboard');

  // Auth state
  const [authState, setAuthState] = useState({ authenticated: false, email: '' });

  // Sheet state
  const [sheetFile, setSheetFile] = useState(null); // { path, headers, rows }
  const [emailConfig, setEmailConfig] = useState({ column: '', startRow: 2, endRow: '' });

  // Template state
  const [selectedDraft, setSelectedDraft] = useState(null); // { id, subject, body }

  // Attachment state
  const [attachmentConfig, setAttachmentConfig] = useState(defaultAttachmentConfig);

  // Derived: filtered rows — normalises the selected email column to `row.email`
  const getSelectedRows = useCallback(() => {
    if (!sheetFile || !emailConfig.column) return [];
    const startIdx = Math.max(0, Number(emailConfig.startRow || 2) - 2);
    const endIdx = emailConfig.endRow ? Number(emailConfig.endRow) - 1 : sheetFile.rows.length;
    return sheetFile.rows
      .slice(startIdx, endIdx)
      .filter((r) => r[emailConfig.column]?.trim())
      .map((r) => ({ ...r, email: r[emailConfig.column].trim() }));
  }, [sheetFile, emailConfig]);

  // Check auth on mount
  useEffect(() => {
    if (!window.api) return;
    window.api.checkAuth().then((result) => {
      setAuthState({ authenticated: result.authenticated, email: result.email || '' });
    });
  }, []);

  const handleAuthChange = (state) => setAuthState(state);

  const navigate = (p) => setPage(p);

  const sharedProps = {
    navigate,
    authState,
    onAuthChange: handleAuthChange,
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard {...sharedProps} sheetFile={sheetFile} selectedDraft={selectedDraft} />;

      case 'sheet':
        return (
          <SheetPreview
            {...sharedProps}
            sheetFile={sheetFile}
            onSheetLoad={setSheetFile}
            emailConfig={emailConfig}
            onEmailConfigChange={setEmailConfig}
          />
        );

      case 'template':
        return (
          <TemplateSelection
            {...sharedProps}
            selectedDraft={selectedDraft}
            onDraftSelect={setSelectedDraft}
          />
        );

      case 'attachment':
        return (
          <AttachmentSetup
            {...sharedProps}
            config={attachmentConfig}
            onChange={setAttachmentConfig}
            rowCount={getSelectedRows().length}
          />
        );

      case 'review':
        return (
          <FinalReview
            {...sharedProps}
            rows={getSelectedRows()}
            draft={selectedDraft}
            attachmentConfig={attachmentConfig}
          />
        );

      case 'sending':
        return (
          <SendingProgress
            {...sharedProps}
            rows={getSelectedRows()}
            draft={selectedDraft}
            attachmentConfig={attachmentConfig}
          />
        );

      case 'logs':
        return <LogsPage {...sharedProps} />;

      case 'settings':
        return <SettingsPage {...sharedProps} />;

      default:
        return <Dashboard {...sharedProps} />;
    }
  };

  // Step completion states for sidebar
  const steps = {
    sheet: !!(sheetFile && emailConfig.column && getSelectedRows().length > 0),
    template: !!selectedDraft,
    attachment: true, // optional step
    review: !!(sheetFile && emailConfig.column && selectedDraft),
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        authState={authState}
        steps={steps}
      />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
}
