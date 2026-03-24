import React from 'react';
import { GraduationCap, Sparkles, ShieldCheck, Layers } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/40 ring-1 ring-white/10">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center ring-2 ring-slate-950">
                <Sparkles className="w-3 h-3 text-amber-950" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">EduPredict</h1>
              <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-lg leading-relaxed">
                Deterministic performance preview, batch analytics, and an optional doubt solver — built for clarity, not
                hype.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Weighted CGPA model</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session-only data</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
