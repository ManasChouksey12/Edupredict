import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Upload,
  LogOut,
  HelpCircle,
  Pencil,
  Users,
  RotateCcw,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useEduPortal } from '../../context/EduPortalContext';
import TeacherStudentForm from './TeacherStudentForm';
import Analytics from '../Analytics';
import PredictionForm from '../PredictionForm';
import BatchProcessor from '../BatchProcessor';
import Dashboard from '../Dashboard';
import type { PredictionResult } from '../../types';

interface TeacherPortalProps {
  onOpenHelp: () => void;
}

type TeacherView = 'roster' | 'edit' | 'import' | 'analytics' | 'workspace';

const TeacherPortal: React.FC<TeacherPortalProps> = ({ onOpenHelp }) => {
  const { records, setRole, resetDemoData, importCsv, getRecord, upsertPredictions } = useEduPortal();
  const [view, setView] = useState<TeacherView>('roster');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [sessionPredictions, setSessionPredictions] = useState<PredictionResult[]>(
    () => records.map(r => r.prediction)
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const editing = editingId ? getRecord(editingId) : undefined;

  const highRisk = records.filter(r => r.prediction.riskLevel === 'high').length;
  const meanCgpa =
    records.length > 0
      ? (records.reduce((s, r) => s + r.prediction.predictedCGPA, 0) / records.length).toFixed(2)
      : '—';

  const runImport = (text: string) => {
    setImportMsg(null);
    const res = importCsv(text);
    if (res.ok) {
      setImportMsg(`Imported ${res.count} row(s).`);
      setPaste('');
      setView('roster');
    } else setImportMsg(res.error);
  };

  const handleSinglePrediction = (result: PredictionResult) => {
    setSessionPredictions(prev => [result, ...prev]);
    setImportMsg('Added 1 prediction to workspace (frontend mock).');
  };

  const handleBatchPredictions = (predictions: PredictionResult[]) => {
    setSessionPredictions(prev => [...predictions, ...prev]);
    setImportMsg(`Added ${predictions.length} predictions to workspace (frontend mock).`);
  };

  const syncWorkspaceToRoster = () => {
    const count = upsertPredictions(sessionPredictions);
    setImportMsg(
      count > 0
        ? `Synced ${count} prediction(s) into teacher roster.`
        : 'No workspace predictions to sync.'
    );
    setView('roster');
  };

  if (view === 'edit' && editing) {
    return (
      <div className="min-h-screen bg-slate-100">
        <TeacherStudentForm record={editing} onBack={() => { setView('roster'); setEditingId(null); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="text-white font-bold tracking-tight">EduPredict</div>
          <div className="text-xs text-slate-500 mt-1">Teacher console</div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          <button
            type="button"
            onClick={() => { setView('roster'); setImportMsg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'roster' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
          <button
            type="button"
            onClick={() => { setView('import'); setImportMsg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'import' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => { setView('analytics'); setImportMsg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'analytics' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Class analytics
          </button>
          <button
            type="button"
            onClick={() => { setView('workspace'); setImportMsg(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'workspace' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Prediction workspace
          </button>
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-800 text-left"
          >
            <HelpCircle className="w-4 h-4" />
            Doubt solver
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all records to built-in Indian demo data?')) resetDemoData();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-800 text-left"
          >
            <RotateCcw className="w-4 h-4" />
            Reset demo data
          </button>
          <button
            type="button"
            onClick={() => setRole(null)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-800 text-left text-red-300"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {view === 'roster' && (
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cohort overview</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {records.length} students · mock Indian roster · edits persist locally
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <LayoutDashboard className="w-4 h-4" />
                  Total
                </div>
                <div className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{records.length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Mean CGPA</div>
                <div className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{meanCgpa}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">High risk</div>
                <div className="text-3xl font-bold text-red-600 mt-2 tabular-nums">{highRisk}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Roll</th>
                    <th className="px-5 py-3">CGPA</th>
                    <th className="px-5 py-3">Risk</th>
                    <th className="px-5 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-medium text-slate-900">{r.data.name}</td>
                      <td className="px-5 py-3 font-mono text-slate-600">{r.rollNumber}</td>
                      <td className="px-5 py-3 tabular-nums font-semibold text-slate-800">
                        {r.prediction.predictedCGPA.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 capitalize">
                        <span
                          className={
                            r.prediction.riskLevel === 'high'
                              ? 'text-red-600 font-medium'
                              : r.prediction.riskLevel === 'medium'
                                ? 'text-amber-600 font-medium'
                                : 'text-emerald-600 font-medium'
                          }
                        >
                          {r.prediction.riskLevel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(r.id);
                            setView('edit');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="p-6 sm:p-10 overflow-auto min-h-0">
            <Analytics
              predictions={records.map(r => r.prediction)}
              theme="light"
              title="Class analytics"
              subtitle="Roster-wide trends from your saved students: risk distribution, performance bands, and cohort factor averages."
            />
          </div>
        )}

        {view === 'import' && (
          <div className="p-6 sm:p-10 max-w-3xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Import students (CSV)</h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Same columns as before: <code className="text-xs bg-slate-100 px-1 rounded">name</code>, optional{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">rollNumber</code>,{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">program</code>,{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">attendanceRate</code>, assignment columns, term
              tests, lab, teacherRemark, etc. Rows merge by roll number or name.
            </p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={async e => {
              const f = e.target.files?.[0];
              if (f) runImport(await f.text());
              e.target.value = '';
            }} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
            >
              <Upload className="w-4 h-4" />
              Choose file
            </button>
            <textarea
              value={paste}
              onChange={e => setPaste(e.target.value)}
              placeholder="Or paste CSV here…"
              rows={12}
              className="w-full rounded-xl border border-slate-200 p-4 text-xs font-mono mb-4"
            />
            <button
              type="button"
              onClick={() => runImport(paste)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Import from text
            </button>
            {importMsg && (
              <p className={`mt-4 text-sm ${importMsg.includes('Imported') ? 'text-emerald-600' : 'text-red-600'}`}>
                {importMsg}
              </p>
            )}
          </div>
        )}

        {view === 'workspace' && (
          <div className="p-6 sm:p-10 space-y-8">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-indigo-950">Frontend-only prediction workspace</h2>
                <p className="text-sm text-indigo-800/80">
                  Run single and batch predictions, then sync them into the teacher roster.
                </p>
              </div>
              <button
                type="button"
                onClick={syncWorkspaceToRoster}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                Sync to roster
              </button>
            </div>
            <div className="workspace-light">
              <PredictionForm onPrediction={handleSinglePrediction} />
            </div>
            <div className="workspace-light">
              <BatchProcessor onBatchPredictions={handleBatchPredictions} />
            </div>
            <div className="workspace-light">
              <Dashboard predictions={sessionPredictions} />
            </div>
            <Analytics
              predictions={sessionPredictions}
              theme="light"
              title="Workspace analytics"
              subtitle="Combined insights from all predictions created in this frontend session."
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherPortal;
