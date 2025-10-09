import React from 'react';
import { Clock, User, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PredictionResult } from '../types';

interface RecentPredictionsProps {
  predictions: PredictionResult[];
}

const RecentPredictions: React.FC<RecentPredictionsProps> = ({ predictions }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Recent Predictions</h2>
            <p className="text-teal-100 text-sm">Latest student performance analyses</p>
          </div>
        </div>
      </div>
      
      <div className="p-8">

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
                <th className="text-left py-4 px-6 font-bold text-slate-700">Student</th>
                <th className="text-left py-4 px-6 font-bold text-slate-700">Predicted CGPA</th>
                <th className="text-left py-4 px-6 font-bold text-slate-700">Final Exam</th>
                <th className="text-left py-4 px-6 font-bold text-slate-700">Risk Level</th>
                <th className="text-left py-4 px-6 font-bold text-slate-700">Confidence</th>
                <th className="text-left py-4 px-6 font-bold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-teal-50/30 transition-all duration-200">
                  <td className="py-5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-blue-100 to-teal-100 p-2 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {prediction.student.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="bg-blue-50 px-3 py-2 rounded-lg inline-block">
                      <span className="text-lg font-bold text-blue-700">
                        {prediction.predictedCGPA.toFixed(2)}
                      </span>
                      <span className="text-xs text-blue-500 ml-1">/10</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="bg-green-50 px-3 py-2 rounded-lg inline-block">
                      <span className="text-lg font-bold text-green-700">
                        {prediction.predictedFinalExam.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-bold ${getRiskColor(prediction.riskLevel)}`}>
                      {getRiskIcon(prediction.riskLevel)}
                      <span className="capitalize">{prediction.riskLevel}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="bg-purple-50 px-3 py-2 rounded-lg inline-block">
                      <span className="font-bold text-purple-700">
                        {(prediction.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-slate-600 font-medium">
                      {prediction.timestamp.toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Predictions Yet</h3>
            <p className="text-slate-600 max-w-md mx-auto">Start by making your first prediction to see recent analyses here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPredictions;