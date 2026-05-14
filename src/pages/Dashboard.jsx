import { FileSpreadsheet, Mail, Paperclip, SendHorizonal, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Dashboard({ navigate, authState, sheetFile, selectedDraft }) {
  const steps = [
    {
      num: 1,
      title: 'Upload Spreadsheet',
      desc: 'Load your Excel or CSV file with email addresses',
      icon: FileSpreadsheet,
      page: 'sheet',
      done: !!sheetFile,
    },
    {
      num: 2,
      title: 'Select Template',
      desc: 'Pick a Gmail draft to use as the email template',
      icon: Mail,
      page: 'template',
      done: !!selectedDraft,
    },
    {
      num: 3,
      title: 'Map Attachments',
      desc: 'Optionally attach local files to each email',
      icon: Paperclip,
      page: 'attachment',
      done: false,
      optional: true,
    },
    {
      num: 4,
      title: 'Review & Send',
      desc: 'Preview the send queue and start bulk sending',
      icon: SendHorizonal,
      page: 'review',
      done: false,
    },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Email Automation</h1>
        <p className="text-slate-500 mt-1">
          Send personalized bulk emails through Gmail using your spreadsheet data.
        </p>
      </div>

      {/* Auth warning */}
      {!authState.authenticated && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div className="flex-1">
            <p className="text-amber-800 font-medium text-sm">Gmail not connected</p>
            <p className="text-amber-700 text-sm mt-0.5">
              You need to connect your Gmail account before sending emails.
            </p>
            <button
              onClick={() => navigate('settings')}
              className="mt-2 text-sm text-amber-700 underline hover:text-amber-900"
            >
              Go to Settings to connect Gmail →
            </button>
          </div>
        </div>
      )}

      {/* Gmail connected banner */}
      {authState.authenticated && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm font-medium">
            Gmail connected as <span className="font-semibold">{authState.email}</span>
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="grid gap-4">
        {steps.map((step) => (
          <button
            key={step.num}
            onClick={() => navigate(step.page)}
            className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                step.done ? 'bg-green-100' : 'bg-indigo-50'
              }`}
            >
              {step.done ? (
                <CheckCircle2 size={20} className="text-green-600" />
              ) : (
                <step.icon size={20} className="text-indigo-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Step {step.num}
                </span>
                {step.optional && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                )}
                {step.done && (
                  <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                    Done
                  </span>
                )}
              </div>
              <p className="text-slate-900 font-semibold mt-0.5">{step.title}</p>
              <p className="text-slate-500 text-sm">{step.desc}</p>
            </div>

            <ArrowRight
              size={18}
              className="text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0"
            />
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate('logs')}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          View send logs
        </button>
        <span className="text-slate-300">·</span>
        <button
          onClick={() => navigate('settings')}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          App settings
        </button>
      </div>
    </div>
  );
}
