import React from 'react';
import { PredictionResult } from '../types';

interface PerformanceChartProps {
  predictions: PredictionResult[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ predictions }) => {
  if (predictions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-slate-300 rounded"></div>
          </div>
          <p className="text-slate-500 font-medium">No data available for visualization</p>
        </div>
      </div>
    );
  }

  // Group predictions by CGPA ranges (0-10 scale)
  const cgpaRanges = [
    { range: '0.0-4.0', min: 0, max: 4, count: 0, color: 'bg-gradient-to-r from-red-400 to-red-500', label: 'Poor' },
    { range: '4.0-6.5', min: 4, max: 6.5, count: 0, color: 'bg-gradient-to-r from-orange-400 to-yellow-500', label: 'Average' },
    { range: '6.5-8.5', min: 6.5, max: 8.5, count: 0, color: 'bg-gradient-to-r from-blue-400 to-blue-500', label: 'Good' },
    { range: '8.5-10.0', min: 8.5, max: 10, count: 0, color: 'bg-gradient-to-r from-green-400 to-green-500', label: 'Excellent' },
  ];

  predictions.forEach(prediction => {
    const cgpa = prediction.predictedCGPA;
    const range = cgpaRanges.find(r => cgpa >= r.min && cgpa < r.max);
    if (range) range.count++;
  });

  const maxCount = Math.max(...cgpaRanges.map(r => r.count));

  return (
    <div className="space-y-4">
      {cgpaRanges.map(({ range, count, color, label }) => {
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        return (
          <div key={range} className="bg-white/60 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-700">{label}</div>
                <div className="text-xs text-slate-500">{range}</div>
              </div>
              <div className="text-lg font-bold text-slate-800">{count}</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-slate-200 rounded-full h-3 relative overflow-hidden">
                <div 
                  className={`h-3 rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-xs text-slate-600 font-medium min-w-[3rem] text-right">
                {percentage.toFixed(0)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PerformanceChart;