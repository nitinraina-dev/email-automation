import {
  LayoutDashboard,
  FileSpreadsheet,
  Mail,
  Paperclip,
  ClipboardList,
  SendHorizonal,
  ScrollText,
  Settings,
  CheckCircle2,
  Circle,
  Wifi,
  WifiOff,
} from 'lucide-react';

const navSteps = [
  { key: 'sheet', label: 'Upload Sheet', icon: FileSpreadsheet, step: 1 },
  { key: 'template', label: 'Select Template', icon: Mail, step: 2 },
  { key: 'attachment', label: 'Attachments', icon: Paperclip, step: 3 },
  { key: 'review', label: 'Final Review', icon: ClipboardList, step: 4 },
  { key: 'sending', label: 'Send Emails', icon: SendHorizonal, step: 5 },
];

const navBottom = [
  { key: 'logs', label: 'Logs', icon: ScrollText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, authState, steps }) {
  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col h-full select-none">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <SendHorizonal size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Email Automation</p>
            <p className="text-slate-500 text-xs">Gmail Bulk Sender</p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="px-3 pt-4">
        <NavItem
          label="Dashboard"
          icon={LayoutDashboard}
          active={currentPage === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
      </div>

      {/* Workflow Steps */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
          Workflow
        </p>
        <div className="space-y-0.5">
          {navSteps.map((item) => (
            <NavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={currentPage === item.key}
              done={steps?.[item.key]}
              onClick={() => onNavigate(item.key)}
              stepNum={item.step}
            />
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom links */}
      <div className="px-3 pb-2">
        <div className="border-t border-slate-800 pt-3 space-y-0.5">
          {navBottom.map((item) => (
            <NavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              active={currentPage === item.key}
              onClick={() => onNavigate(item.key)}
            />
          ))}
        </div>
      </div>

      {/* Auth status */}
      <div className="px-4 py-3 border-t border-slate-800">
        {authState.authenticated ? (
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-green-400 text-xs font-medium">Gmail Connected</p>
              <p className="text-slate-500 text-xs truncate">{authState.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-slate-500 text-xs">Gmail not connected</p>
              <button
                className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
                onClick={() => onNavigate('settings')}
              >
                Connect now →
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({ label, icon: Icon, active, done, onClick, stepNum }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all text-left group ${
        active
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      {done && !active && (
        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
      )}
      {!done && stepNum && !active && (
        <span className="text-slate-600 text-xs">{stepNum}</span>
      )}
    </button>
  );
}
