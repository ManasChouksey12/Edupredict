import React, { useState } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEduPortal } from '../../context/EduPortalContext';
import StudentPerformanceDashboard from './StudentPerformanceDashboard';
import HelpModal from './HelpModal';

const StudentPortal: React.FC = () => {
  const { records, selectedStudentId, setSelectedStudentId, setRole, getRecord, portalBackendActive } =
    useEduPortal();
  const auth = useAuth();
  const [localHelp, setLocalHelp] = useState(false);

  const exitStudentRole = () => {
    if (portalBackendActive) auth.logout();
    else setRole(null);
  };

  const record = selectedStudentId ? getRecord(selectedStudentId) : undefined;

  if (record) {
    return (
      <>
        <StudentPerformanceDashboard
          record={record}
          onSignOut={() => {
            if (portalBackendActive) auth.logout();
            else setSelectedStudentId(null);
          }}
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
            <h1 className="text-lg font-semibold">
              {portalBackendActive ? 'Your academic record' : 'Student portal (offline)'}
            </h1>
            <p className="text-blue-200/80 text-sm">
              {portalBackendActive
                ? 'Data from the database — you only see rows matching your roll number (enforced by the API).'
                : 'Pick a local roster row. Sign in with Spring Boot for live data from the server.'}
            </p>
          </div>
          <button
            type="button"
            onClick={exitStudentRole}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {records.length === 0 ?
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 text-center text-sm leading-relaxed">
            <p className="font-medium text-slate-800 mb-2">No roster row for your account</p>
            <p>
              Ask your teacher to create a roster row whose roll number matches the one on your account, then sign in
              again so this page can load your record from the server.
            </p>
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        }
      </main>
    </div>
  );
};

export default StudentPortal;
