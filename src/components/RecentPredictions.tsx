import React from 'react';
import { Clock, User, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { PredictionResult } from '../types';

interface RecentPredictionsProps {
  predictions: PredictionResult[];
}

const RecentPredictions: React.FC<RecentPredictionsProps> = ({ predictions }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
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
    <div className="rounded-2xl border border-white/10 bg-slate-900/35 backdrop-blur-md overflow-hidden">
      <div className="border-b border-white/10 px-6 sm:px-8 py-5 bg-slate-950/40">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-500/20 rounded-xl flex items-center justify-center ring-1 ring-indigo-400/30">
            <Clock className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Recent activity</h2>
            <p className="text-slate-500 text-sm">Newest predictions in this browser session</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-600/40 bg-slate-950/30 p-4 sm:p-5 hover:border-slate-500/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-base">{prediction.student.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-slate-500 mt-0.5">
                        <Calendar className="w-4 h-4" />
                        <span>{prediction.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-center min-w-[4rem]">
                      <div className="text-xl font-bold text-sky-300 tabular-nums">
                        {prediction.predictedCGPA.toFixed(2)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">CGPA</div>
                    </div>

                    <div className="text-center min-w-[4rem]">
                      <div className="text-xl font-bold text-emerald-300 tabular-nums">
                        {prediction.predictedFinalExam.toFixed(0)}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Exam</div>
                    </div>
                    
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold ${getRiskColor(prediction.riskLevel)}`}>
                      {getRiskIcon(prediction.riskLevel)}
                      <span className="capitalize">{prediction.riskLevel}</span>
                    </div>
                    
                    <div className="text-center min-w-[4rem]">
                      <div className="text-lg font-bold text-violet-300 tabular-nums">
                        {(prediction.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Complete</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Nothing here yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Predict or batch import to populate this list.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPredictions;