import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  UserPlus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEduPortal } from '../../context/EduPortalContext';
import TeacherStudentForm from './TeacherStudentForm';
import Analytics from '../Analytics';
import PredictionForm from '../PredictionForm';
import BatchProcessor from '../BatchProcessor';
import Dashboard from '../Dashboard';
import type { PredictionResult, StudentData } from '../../types';
import type { StudentRecord } from '../../types/portal';
import { predictPerformance } from '../../utils/mlModel';
import { buildCgpaHistory, DEFAULT_SEMESTERS } from '../../utils/cgpaHistory';

function blankStudentRecord(): StudentRecord {
  const defaults: StudentData = {
    name: '',
    attendanceRate: 85,
    assignments: [8, 8, 8],
    assignmentAverage: 0,
    termAssessment1: 16,
    termAssessment2: 17,
    labMarks: 24,
    labTotal: 30,
    teacherRemark: 8,
    remarkCaption: '',
    previousSGPA: 8,
  };
  const pred = predictPerformance({ ...defaults, name: 'New student', id: 'draft' });
  return {
    id: '',
    rollNumber: '',
    program: '',
    data: { ...defaults, assignmentAverage: pred.student.assignmentAverage },
    prediction: { ...pred, timestamp: new Date() },
    teacherNarrative: '',
    improvementActions: [],
    cgpaSemesters: [...DEFAULT_SEMESTERS],
    cgpaHistory: buildCgpaHistory(pred.predictedCGPA),
  };
}

interface TeacherPortalProps {
  onOpenHelp: () => void;
}

type TeacherView = 'roster' | 'edit' | 'import' | 'analytics' | 'workspace';

const TeacherPortal: React.FC<TeacherPortalProps> = ({ onOpenHelp }) => {
  const {
    records,
    setRole,
    resetDemoData,
    importCsv,
    getRecord,
    upsertPredictions,
    portalBackendActive,
    deleteStudentRecord,
  } = useEduPortal();
  const auth = useAuth();

  const [view, setView] = useState<TeacherView>('roster');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [sessionPredictions, setSessionPredictions] = useState<PredictionResult[]>(
    () => records.map(r => r.prediction)
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [draftKey, setDraftKey] = useState(0);

  const blankTemplate = useMemo(() => blankStudentRecord(), []);

  useEffect(() => {
    if (!portalBackendActive) return;
    setSessionPredictions([]);
  }, [portalBackendActive]);

  const editing = editingId ? getRecord(editingId) : undefined;

  const highRisk = records.filter(r => r.prediction.riskLevel === 'high').length;
  const meanCgpa =
    records.length > 0
      ? (records.reduce((s, r) => s + r.prediction.predictedCGPA, 0) / records.length).toFixed(2)
      : '—';

  const rosterHint = portalBackendActive
    ? `${records.length} students · MySQL (via JDBC) · supervised ML rescoring on save`
    : `${records.length} students · offline mode (local browser only)`;

  const workspaceTitle = portalBackendActive
    ? 'Prediction workspace — API-connected'
    : 'Prediction workspace (offline previews)';
  const workspaceBody = portalBackendActive
    ? 'Select a roll number to load saved metrics from MySQL (student fields are read-only here), predict with `/api/ml`, then Sync to save. Update marks in Roster.'
    : 'Run predictions here, then sync into your local roster; sign in with the API for server-backed scoring.';

  const runImport = async (text: string) => {
    setImportMsg(null);
    const res = await importCsv(text);
    if (res.ok) {
      setImportMsg(`Imported ${res.count} row(s).`);
      setPaste('');
      setView('roster');
    } else setImportMsg(res.error);
  };

  const handleSinglePrediction = (result: PredictionResult) => {
    setSessionPredictions(prev => [result, ...prev]);
    setImportMsg(
      portalBackendActive
        ? 'Added one prediction draft — Sync sends it via the supervised ML endpoints and roster batch API.'
        : 'Added one prediction to the workspace preview (offline).'
    );
  };

  const handleBatchPredictions = (predictions: PredictionResult[]) => {
    if (predictions.length === 0) return;
    setSessionPredictions(prev => [...predictions, ...prev]);
    setImportMsg(
      predictions.length <= 1
        ? predictions.length +
            ' prediction drafted.' +
            (portalBackendActive ? ' Sync to persist via roster batch POST.' : '')
        : `${predictions.length} predictions drafted.${
            portalBackendActive ? ' Sync batches them through roster POST.' : ''
          }`
    );
  };

  const syncWorkspaceToRoster = async () => {
    const count = await upsertPredictions(sessionPredictions);
    setImportMsg(
      count > 0
        ? `Synced ${count} prediction(s) into teacher roster.`
        : 'No workspace predictions to sync.'
    );
    setView('roster');
  };

  const signOutTeacher = () => {
    if (portalBackendActive) auth.logout();
    else setRole(null);
    setCreatingNew(false);
  };

  if (view === 'edit' && creatingNew) {
    return (
      <div className="min-h-screen bg-slate-100">
        <TeacherStudentForm
          key={`new-${draftKey}`}
          creatingNew
          record={blankTemplate}
          savesToSpringApi={portalBackendActive}
          onBack={() => {
            setCreatingNew(false);
            setView('roster');
          }}
        />
      </div>
    );
  }

  if (view === 'edit' && editing) {
    return (
      <div className="min-h-screen bg-slate-100">
        <TeacherStudentForm
          record={editing}
          savesToSpringApi={portalBackendActive}
          onBack={() => {
            setView('roster');
            setEditingId(null);
            setCreatingNew(false);
          }}
        />
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
            onClick={() => {
              setCreatingNew(false);
              setEditingId(null);
              setView('roster');
              setImportMsg(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'roster' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingNew(false);
              setEditingId(null);
              setView('import');
              setImportMsg(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'import' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingNew(false);
              setEditingId(null);
              setView('analytics');
              setImportMsg(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'analytics' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Class analytics
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingNew(false);
              setEditingId(null);
              setView('workspace');
              setImportMsg(null);
            }}
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
              if (portalBackendActive && !confirm('Delete every roster row in the backend (cannot undo)?')) return;
              if (!portalBackendActive && !confirm('Clear all students from this offline roster?')) return;
              void resetDemoData();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-800 text-left"
          >
            <RotateCcw className="w-4 h-4" />
            {portalBackendActive ? 'Clear roster (database)' : 'Clear offline roster'}
          </button>
          <button
            type="button"
            onClick={signOutTeacher}
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
                <p className="text-slate-500 text-sm mt-1">{rosterHint}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftKey(k => k + 1);
                  setCreatingNew(true);
                  setEditingId(null);
                  setView('edit');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                <UserPlus className="w-4 h-4" />
                Add student
              </button>
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
                    <th className="px-5 py-3 w-24">Edit</th>
                    <th className="px-5 py-3 w-24">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ?
                    <tr>
                      <td className="px-5 py-14 text-center text-slate-500 text-sm" colSpan={6}>
                        No students in the roster yet. Use <strong>Add student</strong> or <strong>Import CSV</strong> so
                        data is loaded from your database-backed roster API.
                      </td>
                    </tr>
                  : records.map(r => (
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
                            setCreatingNew(false);
                            setEditingId(r.id);
                            setView('edit');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            const label = r.data.name?.trim() || r.rollNumber;
                            if (!confirm(`Remove ${label} from the roster?`)) return;
                            void deleteStudentRecord(r.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
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
              {portalBackendActive && (
                <>
                  {' '}
                  With the API enabled, import uses{' '}
                  <code className="text-xs bg-slate-100 px-1 rounded">POST /api/portal/students/batch</code> to merge
                  rows.
                </>
              )}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async e => {
                const f = e.target.files?.[0];
                if (f) await runImport(await f.text());
                e.target.value = '';
              }}
            />
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
              onClick={() => void runImport(paste)}
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
                <h2 className="font-semibold text-indigo-950">{workspaceTitle}</h2>
                <p className="text-sm text-indigo-800/80">{workspaceBody}</p>
              </div>
              <button
                type="button"
                onClick={() => void syncWorkspaceToRoster()}
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
