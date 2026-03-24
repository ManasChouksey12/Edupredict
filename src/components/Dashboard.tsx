import React, { useMemo } from 'react';
import { LayoutDashboard, Users, Award, BookOpen, Gauge, Target } from 'lucide-react';
import { PredictionResult } from '../types';
import RecentPredictions from './RecentPredictions';
import DashboardCharts from './DashboardCharts';

interface DashboardProps {
  predictions: PredictionResult[];
}

const Dashboard: React.FC<DashboardProps> = ({ predictions }) => {
  const totalPredictions = predictions.length;
  const lowRiskCount = predictions.filter(p => p.riskLevel === 'low').length;
  const highRiskCount = predictions.filter(p => p.riskLevel === 'high').length;
  const averageCGPA =
    predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.predictedCGPA, 0) / predictions.length
      : 0;
  const averageConfidence =
    predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      : 0;

  const latestCgpa = predictions[0]?.predictedCGPA;

  const stats = useMemo(
    () => [
      {
        label: 'Records in session',
        value: totalPredictions.toString(),
        hint: 'Predict + batch runs',
        icon: Users,
        accent: 'from-sky-500 to-blue-600',
      },
      {
        label: 'Low-risk count',
        value: lowRiskCount.toString(),
        hint: 'Of total records',
        icon: Award,
        accent: 'from-emerald-500 to-teal-600',
      },
      {
        label: 'Mean predicted CGPA',
        value: averageCGPA.toFixed(2),
        hint: 'Across session',
        icon: BookOpen,
        accent: 'from-violet-500 to-purple-600',
      },
      {
        label: 'Data completeness',
        value: `${(averageConfidence * 100).toFixed(0)}%`,
        hint: 'Model completeness score',
        icon: Gauge,
        accent: 'from-amber-500 to-orange-600',
      },
    ],
    [totalPredictions, lowRiskCount, averageCGPA, averageConfidence]
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur-xl p-8 shadow-xl shadow-black/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-300/90 text-xs font-semibold uppercase tracking-widest mb-3">
              <LayoutDashboard className="w-4 h-4" />
              Student dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Performance overview</h1>
            <p className="text-slate-400 mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
              Session-level metrics and charts from your predictions. Official grades always come from your institution;
              this view is for planning and trends.
            </p>
          </div>
          {totalPredictions > 0 && latestCgpa != null && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-4 min-w-[200px]">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Latest run</div>
              <div className="text-3xl font-bold text-white tabular-nums">{latestCgpa.toFixed(2)}</div>
              <div className="text-sm text-slate-400 mt-1">CGPA (most recent)</div>
              {highRiskCount > 0 && (
                <div className="mt-3 flex items-center gap-2 text-amber-200/90 text-xs">
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  {highRiskCount} high-risk record{highRiskCount !== 1 ? 's' : ''} — review in list below
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, hint, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-5 hover:bg-white/[0.09] transition-colors"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-4 shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums tracking-tight">{value}</div>
            <div className="text-sm font-medium text-slate-300 mt-1">{label}</div>
            <div className="text-xs text-slate-500 mt-2">{hint}</div>
          </div>
        ))}
      </div>

      {predictions.length > 0 && (
        <>
          <DashboardCharts predictions={predictions} />
          <RecentPredictions predictions={predictions.slice(0, 10)} />
        </>
      )}

      {predictions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/30 backdrop-blur-sm p-14 text-center">
          <LayoutDashboard className="w-14 h-14 text-slate-600 mx-auto mb-5" />
          <h3 className="text-xl font-semibold text-white mb-2">No session data yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Run a single prediction or upload a batch. Charts and summaries will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
