import React, { useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { PredictionResult } from '../types';
import { buildCohortPayload } from '../utils/geminiExplain';
import { buildLocalCohortInsight } from '../utils/localAssistant';
import InsightsPanel from './InsightsPanel';

export interface AnalyticsProps {
  predictions: PredictionResult[];
  /** `light` fits the teacher console; `dark` matches the legacy full-page gradient app. */
  theme?: 'dark' | 'light';
  title?: string;
  subtitle?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({
  predictions,
  theme = 'dark',
  title = 'Analytics Dashboard',
  subtitle = 'Advanced insights and performance metrics',
}) => {
  const isLight = theme === 'light';
  const totalStudents = predictions.length;
  const averageCGPA =
    totalStudents > 0
      ? predictions.reduce((sum, p) => sum + p.predictedCGPA, 0) / totalStudents
      : 0;

  const riskDistribution = {
    high: predictions.filter(p => p.riskLevel === 'high').length,
    medium: predictions.filter(p => p.riskLevel === 'medium').length,
    low: predictions.filter(p => p.riskLevel === 'low').length,
  };

  const cohortPayload = useMemo(
    () => buildCohortPayload(predictions, 'session_analytics'),
    [predictions]
  );

  if (totalStudents === 0) {
    return (
      <div
        className={
          isLight
            ? 'rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm'
            : 'glass-card rounded-3xl p-12 text-center'
        }
      >
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isLight ? 'bg-indigo-100' : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }`}
        >
          <BarChart3 className={`w-12 h-12 ${isLight ? 'text-indigo-600' : 'text-white'}`} />
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Class analytics
        </h2>
        <p className={`text-lg max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-blue-200'}`}>
          Add students to your roster or import a CSV to see cohort risk, CGPA distribution, and factor averages.
        </p>
      </div>
    );
  }

  const averageExamScore = predictions.reduce((sum, p) => sum + p.predictedFinalExam, 0) / totalStudents;
  const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalStudents;

  const cgpaDistribution = {
    'A (8.5-10.0)': predictions.filter(p => p.predictedCGPA >= 8.5).length,
    'B (6.5-8.4)': predictions.filter(p => p.predictedCGPA >= 6.5 && p.predictedCGPA < 8.5).length,
    'C (4.0-6.4)': predictions.filter(p => p.predictedCGPA >= 4.0 && p.predictedCGPA < 6.5).length,
    'D-F (0-3.9)': predictions.filter(p => p.predictedCGPA < 4.0).length,
  };

  const performanceFactors = [
    {
      factor: 'Attendance Rate',
      average: predictions.reduce((sum, p) => sum + p.student.attendanceRate, 0) / totalStudents,
      impact: 'High',
      color: 'text-red-600 bg-red-50',
    },
    {
      factor: 'Assignment Average',
      average: predictions.reduce((sum, p) => sum + p.student.assignmentAverage, 0) / totalStudents,
      impact: 'High',
      color: 'text-red-600 bg-red-50',
    },
    {
      factor: 'Term Assessment 1',
      average: predictions.reduce((sum, p) => sum + p.student.termAssessment1, 0) / totalStudents,
      impact: 'Medium',
      color: 'text-yellow-600 bg-yellow-50',
    },
    {
      factor: 'Term Assessment 2',
      average: predictions.reduce((sum, p) => sum + p.student.termAssessment2, 0) / totalStudents,
      impact: 'Medium',
      color: 'text-yellow-600 bg-yellow-50',
    },
    {
      factor: 'Lab Performance',
      average:
        predictions.reduce((sum, p) => sum + (p.student.labMarks / p.student.labTotal) * 100, 0) /
        totalStudents,
      impact: 'Low',
      color: 'text-green-600 bg-green-50',
    },
    {
      factor: 'Teacher Remark',
      average: predictions.reduce((sum, p) => sum + p.student.teacherRemark, 0) / totalStudents,
      impact: 'Low',
      color: 'text-green-600 bg-green-50',
    },
  ];

  const cardWrap = isLight
    ? 'rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8'
    : 'glass-card rounded-3xl p-8';

  const statCard = isLight
    ? 'bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow'
    : 'stat-card floating-card';

  return (
    <div className="space-y-8">
      <div
        className={
          isLight
            ? 'rounded-2xl border border-slate-200 bg-white shadow-sm p-8 relative overflow-hidden'
            : 'glass-card rounded-3xl p-8 relative overflow-hidden'
        }
      >
        {!isLight && (
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl" />
        )}
        {isLight && (
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
        )}
        <div className="relative z-10 flex items-center space-x-4 mb-1">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isLight
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                : 'bg-gradient-to-br from-purple-500 to-pink-600'
            }`}
          >
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h1>
            <p className={isLight ? 'text-slate-500 text-base' : 'text-blue-200 text-lg'}>{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={statCard}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Total
                </div>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-gray-800'}`}>
                {totalStudents}
              </div>
              <div className={`font-medium ${isLight ? 'text-slate-600' : 'text-gray-600'}`}>
                Students in cohort
              </div>
            </div>
          </div>

          <div className={statCard}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Avg
                </div>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-gray-800'}`}>
                {averageCGPA.toFixed(2)}
              </div>
              <div className={`font-medium ${isLight ? 'text-slate-600' : 'text-gray-600'}`}>Average CGPA</div>
            </div>
          </div>

          <div className={statCard}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  Exam
                </div>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-gray-800'}`}>
                {averageExamScore.toFixed(0)}%
              </div>
              <div className={`font-medium ${isLight ? 'text-slate-600' : 'text-gray-600'}`}>Avg exam score</div>
            </div>
          </div>

          <div className={statCard}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  Data
                </div>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-gray-800'}`}>
                {(averageConfidence * 100).toFixed(0)}%
              </div>
              <div className={`font-medium ${isLight ? 'text-slate-600' : 'text-gray-600'}`}>
                Avg completeness score
              </div>
            </div>
          </div>
        </div>

        <InsightsPanel
          title="Cohort insights"
          subtitle="On-device summary from your full class roster — no API calls."
          body={buildLocalCohortInsight(cohortPayload)}
          theme={isLight ? 'light' : 'dark'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={cardWrap}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Risk level distribution
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(riskDistribution).map(([level, count]) => {
                const percentage = (count / totalStudents) * 100;
                const colors = {
                  high: {
                    bg: 'bg-red-500',
                    text: isLight ? 'text-red-600' : 'text-red-300',
                    label: 'High risk',
                  },
                  medium: {
                    bg: 'bg-yellow-500',
                    text: isLight ? 'text-amber-600' : 'text-yellow-300',
                    label: 'Medium risk',
                  },
                  low: {
                    bg: 'bg-green-500',
                    text: isLight ? 'text-emerald-600' : 'text-green-300',
                    label: 'Low risk',
                  },
                };

                return (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {colors[level as keyof typeof colors].label}
                      </span>
                      <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                        {count} students
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-3 ${isLight ? 'bg-slate-100' : 'bg-white/20'}`}>
                      <div
                        className={`h-3 rounded-full ${colors[level as keyof typeof colors].bg} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${colors[level as keyof typeof colors].text}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cardWrap}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                CGPA grade distribution
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(cgpaDistribution).map(([grade, count]) => {
                const percentage = (count / totalStudents) * 100;
                const color = grade.startsWith('A')
                  ? 'bg-green-500'
                  : grade.startsWith('B')
                    ? 'bg-blue-500'
                    : grade.startsWith('C')
                      ? 'bg-yellow-500'
                      : 'bg-red-500';

                return (
                  <div key={grade} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>{grade}</span>
                      <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                        {count} students
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-3 ${isLight ? 'bg-slate-100' : 'bg-white/20'}`}>
                      <div
                        className={`h-3 rounded-full ${color} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cardWrap}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Performance factor analysis
            </h3>
          </div>
          <div className="space-y-4">
            {performanceFactors.map(({ factor, average, impact }) => {
              const impactColors = {
                High: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
                Medium: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
                Low: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
              };

              return (
                <div
                  key={factor}
                  className={
                    isLight
                      ? 'bg-slate-50 border border-slate-100 rounded-xl p-4'
                      : 'bg-white/10 backdrop-blur-sm rounded-xl p-4'
                  }
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {factor}
                      </div>
                      <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-blue-200'}`}>
                        Cohort average:{' '}
                        {factor.includes('Remark')
                          ? `${average.toFixed(1)}/10`
                          : factor.includes('Assessment')
                            ? `${average.toFixed(1)}/20`
                            : `${average.toFixed(1)}%`}
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 ${impactColors[impact as keyof typeof impactColors]}`}
                    >
                      {impact} impact
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
