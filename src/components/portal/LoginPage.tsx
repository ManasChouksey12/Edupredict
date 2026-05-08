import React, { useState } from 'react';
import { GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login, enterOfflineDemo } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await login(username, password);
    setBusy(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="text-center mb-10 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/30 mb-5">
          <GraduationCap className="w-8 h-8 text-indigo-300" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">EduPredict</h1>
        <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
          Teachers use teacher credentials. Students created in the roster use their roll number as both username and
          initial password, then fill in academics from the student dashboard.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-8 shadow-xl"
      >
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 mb-4"
          placeholder="teacher or your roll number"
        />
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 mb-6"
          placeholder="Teacher: teacher123 · Students: roll number as password until changed"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={() => enterOfflineDemo()}
          className="w-full mt-4 text-center text-sm text-indigo-200/90 hover:text-white underline-offset-4 hover:underline"
        >
          Continue offline (local browser only, no API)
        </button>
      </form>

      <p className="text-slate-600 text-xs mt-10 max-w-lg text-center leading-relaxed">
        Backend (JDK 17+): open <code className="text-indigo-200/70">backend</code> then run{' '}
        <code className="text-indigo-200/70">mvn spring-boot:run</code> on port 8080. This Vite dev server proxies{' '}
        <code className="text-indigo-200/70">/api</code> to Spring.
      </p>
    </div>
  );
};

export default LoginPage;
