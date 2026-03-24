import React, { useState } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useEduPortal } from '../../context/EduPortalContext';
import StudentPerformanceDashboard from './StudentPerformanceDashboard';
import HelpModal from './HelpModal';

const StudentPortal: React.FC = () => {
  const { records, selectedStudentId, setSelectedStudentId, setRole, getRecord } = useEduPortal();
  const [localHelp, setLocalHelp] = useState(false);

  const record = selectedStudentId ? getRecord(selectedStudentId) : undefined;

  if (record) {
    return (
      <>
        <StudentPerformanceDashboard
          record={record}
          onSignOut={() => setSelectedStudentId(null)}
          onOpenHelp={() => setLocalHelp(true)}
        />
        {localHelp && <HelpModal onClose={() => setLocalHelp(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#1e3a5f] text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Student sign-in (demo)</h1>
            <p className="text-blue-200/80 text-sm">Select your record — no password in this mock</p>
          </div>
          <button
            type="button"
            onClick={() => setRole(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Change role
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {records.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedStudentId(r.id)}
              className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserCircle className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{r.data.name}</h2>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{r.rollNumber}</p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{r.program}</p>
                  <p className="text-sm font-semibold text-indigo-700 mt-3">
                    CGPA {r.prediction.predictedCGPA.toFixed(2)} ·{' '}
                    <span className="capitalize">{r.prediction.riskLevel}</span> risk
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;
