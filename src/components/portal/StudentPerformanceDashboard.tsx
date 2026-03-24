import React, { useMemo, useState } from 'react';
import {
  Bell,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import type { StudentRecord } from '../../types/portal';
import { predictPerformance } from '../../utils/mlModel';
import { deriveFactorBars, deriveStrengthsWeaknesses } from '../../utils/studentInsights';

const chartText = '#475569';
const grid = 'rgba(15, 23, 42, 0.06)';

interface StudentPerformanceDashboardProps {
  record: StudentRecord;
  onSignOut: () => void;
  onOpenHelp: () => void;
}

const StudentPerformanceDashboard: React.FC<StudentPerformanceDashboardProps> = ({
  record,
  onSignOut,
  onOpenHelp,
}) => {
  const { data, prediction, improvementActions, teacherNarrative, cgpaSemesters, cgpaHistory } =
    record;

  const [wAttendance, setWAttendance] = useState(data.attendanceRate);
  const [wExam, setWExam] = useState(Math.round((data.termAssessment1 + data.termAssessment2) / 2));

  const whatIf = useMemo(() => {
    const d = {
      ...data,
      attendanceRate: wAttendance,
      termAssessment1: wExam,
      termAssessment2: wExam,
    };
    return predictPerformance(d);
  }, [data, wAttendance, wExam]);

  const factorBars = useMemo(() => deriveFactorBars(data), [data]);
  const { strengths, weaknesses } = useMemo(() => deriveStrengthsWeaknesses(data), [data]);

  const lineData = {
    labels: cgpaSemesters,
    datasets: [
      {
        label: 'CGPA',
        data: cgpaHistory,
        borderColor: '#1e40af',
        backgroundColor: 'rgba(30, 64, 175, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: chartText, font: { size: 11 } }, grid: { color: grid } },
      y: {
        min: 4,
        max: 10,
        ticks: { color: chartText, stepSize: 1 },
        grid: { color: grid },
      },
    },
  };

  const barCompare = {
    labels: ['Attendance', 'Avg marks (scaled)'],
    datasets: [
      {
        label: '%',
        data: [data.attendanceRate, data.assignmentAverage],
        backgroundColor: ['rgba(234, 88, 12, 0.85)', 'rgba(37, 99, 235, 0.85)'],
        borderRadius: 8,
        borderSkipped: false as const,
      },
    ],
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { max: 100, ticks: { color: chartText }, grid: { color: grid } },
      y: { ticks: { color: chartText }, grid: { display: false } },
    },
  };

  const riskStyles =
    prediction.riskLevel === 'high'
      ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: AlertTriangle }
      : prediction.riskLevel === 'medium'
        ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: AlertTriangle }
        : { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: CheckCircle2 };

  const RiskIcon = riskStyles.icon;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&size=128&background=1e3a5f&color=fff&bold=true`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-[#1e3a5f] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Student Performance Dashboard</h1>
            <p className="text-blue-200/80 text-xs sm:text-sm mt-0.5">Personalized view · data from your teacher</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10 text-blue-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/10 text-blue-100 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium"
            >
              <HelpCircle className="w-4 h-4" />
              Doubts
            </button>
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full ring-2 ring-white/30"
            />
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex items-center gap-5">
              <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full ring-4 ring-slate-100" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{data.name}</h2>
                <p className="text-slate-500 text-sm mt-1">
                  ID <span className="font-mono text-slate-700">{record.rollNumber}</span>
                </p>
                <p className="text-slate-600 text-sm mt-1">{record.program}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-1 lg:justify-end">
              <div className="rounded-xl bg-[#1e3a5f] text-white px-6 py-4 min-w-[160px] shadow-md">
                <div className="text-blue-200 text-xs uppercase tracking-wide font-medium">Predicted CGPA</div>
                <div className="text-3xl font-bold tabular-nums mt-1">{prediction.predictedCGPA.toFixed(2)}</div>
                <div className="text-blue-200/80 text-xs mt-1">Out of 10.0 · model estimate</div>
              </div>
              <div
                className={`rounded-xl border-2 px-6 py-4 min-w-[180px] ${riskStyles.bg} ${riskStyles.border}`}
              >
                <div className={`flex items-center gap-2 text-xs uppercase tracking-wide font-semibold ${riskStyles.text}`}>
                  <RiskIcon className="w-4 h-4" />
                  Risk level
                </div>
                <div className={`text-2xl font-bold capitalize mt-1 ${riskStyles.text}`}>
                  {prediction.riskLevel} risk
                </div>
                <div className="text-slate-600 text-xs mt-1">Based on your current inputs</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">CGPA trend</h3>
            <p className="text-xs text-slate-500 mb-4">Illustrative semester path leading to your current estimate</p>
            <div className="h-[240px]">
              <Line data={lineData} options={lineOpts} />
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Attendance & assignment strength</h3>
            <p className="text-xs text-slate-500 mb-4">Compared on a 0–100 scale</p>
            <div className="h-[240px]">
              <Bar data={barCompare} options={barOpts} />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Factors to watch</h3>
            <div className="space-y-4">
              {factorBars.map(f => (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{f.label}</span>
                    <span className="text-slate-500 tabular-nums">{f.pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${f.pct}%`, backgroundColor: f.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Assigned by your teacher</h3>
            <ul className="space-y-3">
              {improvementActions.length === 0 ? (
                <li className="text-slate-500 text-sm">No action items yet — your teacher may add them soon.</li>
              ) : (
                improvementActions.map((a, i) => (
                  <li key={a.id} className="flex gap-3 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{a.text}</span>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Teacher remark</h4>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{teacherNarrative}</p>
              {data.remarkCaption && (
                <p className="text-xs text-slate-400 mt-2 italic">Caption: {data.remarkCaption}</p>
              )}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">What-if analysis</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Slide to explore how attendance and a combined exam focus (both term tests set equal) would change the
            estimate. This does not save — it is for planning.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                Attendance
                <span className="tabular-nums text-indigo-600">{wAttendance}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={wAttendance}
                onChange={e => setWAttendance(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                Exam focus (each term test /20)
                <span className="tabular-nums text-indigo-600">{wExam}</span>
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={wExam}
                onChange={e => setWExam(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Estimated CGPA</div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{whatIf.predictedCGPA.toFixed(2)}</div>
            </div>
            <div className="h-10 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Risk</div>
              <div className="text-lg font-semibold capitalize text-slate-800">{whatIf.riskLevel}</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Strengths</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                {strengths.map(s => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Areas to improve</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                {weaknesses.map(s => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <button
          type="button"
          onClick={onOpenHelp}
          className="sm:hidden w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm"
        >
          Open doubt solver
        </button>
      </main>
    </div>
  );
};

export default StudentPerformanceDashboard;
