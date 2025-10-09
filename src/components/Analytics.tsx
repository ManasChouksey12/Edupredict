import React from 'react';
import { BarChart3, PieChart, TrendingUp, Users } from 'lucide-react';
import { PredictionResult } from '../types';

interface AnalyticsProps {
  predictions: PredictionResult[];
}

const Analytics: React.FC<AnalyticsProps> = ({ predictions }) => {
  if (predictions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Analytics Dashboard</h2>
          <p className="text-slate-600">
            Start making predictions to see detailed analytics and insights
          </p>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalStudents = predictions.length;
  const averageCGPA = predictions.reduce((sum, p) => sum + p.predictedCGPA, 0) / totalStudents;
  const averageExamScore = predictions.reduce((sum, p) => sum + p.predictedFinalExam, 0) / totalStudents;
  const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalStudents;

  const riskDistribution = {
    high: predictions.filter(p => p.riskLevel === 'high').length,
    medium: predictions.filter(p => p.riskLevel === 'medium').length,
    low: predictions.filter(p => p.riskLevel === 'low').length,
  };

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
      average: predictions.reduce((sum, p) => sum + (p.student.labMarks / p.student.labTotal * 100), 0) / totalStudents,
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-purple-100 text-sm">Advanced insights and performance metrics</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{totalStudents}</p>
                </div>
                <div className="bg-blue-200/50 p-3 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-600">Average CGPA</p>
                  <p className="text-3xl font-bold text-green-800 mt-2">{averageCGPA.toFixed(2)}</p>
                </div>
                <div className="bg-green-200/50 p-3 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600">Avg Exam Score</p>
                  <p className="text-3xl font-bold text-purple-800 mt-2">{averageExamScore.toFixed(0)}%</p>
                </div>
                <div className="bg-purple-200/50 p-3 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-600">Model Confidence</p>
                  <p className="text-3xl font-bold text-orange-800 mt-2">{(averageConfidence * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-orange-200/50 p-3 rounded-xl">
                  <PieChart className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Risk Distribution */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50/50 rounded-xl p-6 border border-red-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Risk Level Distribution</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(riskDistribution).map(([level, count]) => {
                  const percentage = (count / totalStudents) * 100;
                  const colors = {
                    high: 'bg-gradient-to-r from-red-400 to-red-500',
                    medium: 'bg-gradient-to-r from-yellow-400 to-orange-500',
                    low: 'bg-gradient-to-r from-green-400 to-green-500'
                  };
                  
                  return (
                    <div key={level} className="bg-white/60 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold capitalize text-slate-700">{level} Risk</span>
                        <span className="text-sm font-bold text-slate-800">{count} students ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${colors[level as keyof typeof colors]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CGPA Distribution */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-6 border border-blue-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>CGPA Grade Distribution</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(cgpaDistribution).map(([grade, count]) => {
                  const percentage = (count / totalStudents) * 100;
                  const color = grade.startsWith('A') ? 'bg-gradient-to-r from-green-400 to-green-500' :
                               grade.startsWith('B') ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                               grade.startsWith('C') ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500';
                  
                  return (
                    <div key={grade} className="bg-white/60 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">{grade}</span>
                        <span className="text-sm font-bold text-slate-800">{count} students ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Factors */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 rounded-xl p-6 border border-amber-200/50">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Performance Factor Analysis</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-amber-200">
                    <th className="text-left py-4 px-4 font-bold text-slate-700">Factor</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700">Average Score</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700">Impact Level</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceFactors.map(({ factor, average, impact, color }) => (
                    <tr key={factor} className="border-b border-amber-100 hover:bg-white/60 transition-colors duration-200">
                      <td className="py-4 px-4 font-semibold text-slate-800">{factor}</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {factor.includes('Remark') 
                          ? `${average.toFixed(1)}/10`
                          : factor.includes('Assessment')
                          ? `${average.toFixed(1)}/20`
                          : `${average.toFixed(1)}%`
                        }
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-2 rounded-xl text-xs font-bold ${color}`}>
                          {impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;