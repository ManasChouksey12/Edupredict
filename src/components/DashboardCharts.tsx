import React, { useMemo } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import type { PredictionResult } from '../types';

const axisColor = 'rgba(148, 163, 184, 0.85)';
const gridColor = 'rgba(148, 163, 184, 0.08)';

interface DashboardChartsProps {
  predictions: PredictionResult[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ predictions }) => {
  const lineData = useMemo(() => {
    const chrono = [...predictions].reverse().slice(-24);
    return {
      labels: chrono.map((p, i) => {
        const name = (p.student.name || `Student ${i + 1}`).slice(0, 14);
        return name.length < (p.student.name || '').length ? `${name}…` : name;
      }),
      datasets: [
        {
          label: 'Predicted CGPA',
          data: chrono.map(p => p.predictedCGPA),
          borderColor: 'rgb(129, 140, 248)',
          backgroundColor: 'rgba(129, 140, 248, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(165, 180, 252)',
          pointBorderColor: 'rgb(79, 70, 229)',
          borderWidth: 2,
        },
      ],
    };
  }, [predictions]);

  const riskData = useMemo(() => {
    const low = predictions.filter(p => p.riskLevel === 'low').length;
    const med = predictions.filter(p => p.riskLevel === 'medium').length;
    const high = predictions.filter(p => p.riskLevel === 'high').length;
    return {
      labels: ['Low risk', 'Medium risk', 'High risk'],
      datasets: [
        {
          data: [low, med, high],
          backgroundColor: ['rgba(34, 197, 94, 0.85)', 'rgba(234, 179, 8, 0.88)', 'rgba(239, 68, 68, 0.88)'],
          borderColor: ['rgb(22, 163, 74)', 'rgb(202, 138, 4)', 'rgb(220, 38, 38)'],
          borderWidth: 1,
          hoverOffset: 8,
        },
      ],
    };
  }, [predictions]);

  const bandData = useMemo(() => {
    const a = predictions.filter(p => p.predictedCGPA >= 8.5).length;
    const b = predictions.filter(p => p.predictedCGPA >= 6.5 && p.predictedCGPA < 8.5).length;
    const c = predictions.filter(p => p.predictedCGPA >= 4 && p.predictedCGPA < 6.5).length;
    const d = predictions.filter(p => p.predictedCGPA < 4).length;
    return {
      labels: ['8.5–10.0 (A range)', '6.5–8.4 (B range)', '4.0–6.4 (C range)', 'Below 4.0'],
      datasets: [
        {
          label: 'Students',
          data: [a, b, c, d],
          backgroundColor: [
            'rgba(52, 211, 153, 0.75)',
            'rgba(96, 165, 250, 0.75)',
            'rgba(251, 191, 36, 0.75)',
            'rgba(248, 113, 113, 0.75)',
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [predictions]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: axisColor, font: { size: 12 } },
      },
    },
    scales: {
      x: {
        ticks: { color: axisColor, maxRotation: 45, minRotation: 0 },
        grid: { color: gridColor },
      },
      y: {
        min: 0,
        max: 10,
        ticks: { color: axisColor, stepSize: 1 },
        grid: { color: gridColor },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: axisColor, padding: 14, font: { size: 12 } },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: axisColor, font: { size: 11 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: axisColor, stepSize: 1 },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/35 backdrop-blur-md p-6 min-h-[300px]">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 tracking-tight">CGPA trend (session order)</h3>
        <p className="text-xs text-slate-500 mb-4">Oldest → newest along the horizontal axis (up to 24 entries).</p>
        <div className="h-[240px]">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/35 backdrop-blur-md p-6 min-h-[300px]">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 tracking-tight">Risk mix</h3>
        <p className="text-xs text-slate-500 mb-4">Share of predictions by risk band.</p>
        <div className="h-[240px] flex items-center justify-center">
          <div className="w-full max-w-[280px] h-[220px]">
            <Doughnut data={riskData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/35 backdrop-blur-md p-6 min-h-[280px] xl:col-span-2">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 tracking-tight">Predicted CGPA bands</h3>
        <p className="text-xs text-slate-500 mb-4">How many students fall into each grade-style band.</p>
        <div className="h-[220px]">
          <Bar data={bandData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
