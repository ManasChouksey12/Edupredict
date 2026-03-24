import React from 'react';
import { GraduationCap, Users, ArrowRight } from 'lucide-react';
import { useEduPortal } from '../../context/EduPortalContext';

const RoleSelect: React.FC = () => {
  const { setRole } = useEduPortal();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="text-center mb-12 max-w-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/30 mb-6">
          <GraduationCap className="w-8 h-8 text-indigo-300" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">EduPredict Portal</h1>
        <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
          Role-based demo: teachers manage cohorts, upload data, and assign improvements. Students see their personal
          dashboard, teacher remarks, and charts. All data is mock / local to this browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <button
          type="button"
          onClick={() => setRole('teacher')}
          className="group text-left rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl p-8 transition-all hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-900/20"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Teacher / Admin</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            View all students, edit profiles, teacher narrative, improvement tasks, and import CSV rows.
          </p>
          <span className="inline-flex items-center gap-2 text-indigo-300 text-sm font-semibold">
            Enter portal
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRole('student')}
          className="group text-left rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl p-8 transition-all hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-900/20"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Student</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Open your performance dashboard: CGPA, risk, charts, teacher-assigned actions, and what-if sliders.
          </p>
          <span className="inline-flex items-center gap-2 text-emerald-300 text-sm font-semibold">
            Enter portal
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>

      <p className="text-slate-600 text-xs mt-12 max-w-md text-center">
        Demo only — no server. Data persists in localStorage until you clear site data or use Reset in the teacher panel.
      </p>
    </div>
  );
};

export default RoleSelect;
