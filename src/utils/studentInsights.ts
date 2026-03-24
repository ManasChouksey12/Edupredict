import type { StudentData } from '../types';

export interface FactorBar {
  label: string;
  pct: number;
  color: string;
}

/** Relative “pressure” bars for the student dashboard (illustrative, from inputs). */
export function deriveFactorBars(data: StudentData): FactorBar[] {
  const labPct = data.labTotal > 0 ? (data.labMarks / data.labTotal) * 100 : 0;
  const termAvg = (data.termAssessment1 + data.termAssessment2) / 2;
  const raw: { label: string; score: number; color: string }[] = [];

  if (data.attendanceRate < 78) {
    raw.push({
      label: 'Low attendance',
      score: (78 - data.attendanceRate) * 1.4,
      color: '#ea580c',
    });
  }
  if (data.assignmentAverage < 72) {
    raw.push({
      label: 'Assignment performance',
      score: (72 - data.assignmentAverage) * 1.1,
      color: '#16a34a',
    });
  }
  if (termAvg < 13) {
    raw.push({
      label: 'Exam / term tests',
      score: (13 - termAvg) * 2.5,
      color: '#2563eb',
    });
  }
  if (labPct < 65) {
    raw.push({
      label: 'Lab marks',
      score: (65 - labPct) * 0.8,
      color: '#7c3aed',
    });
  }

  if (raw.length === 0) {
    return [{ label: 'Balanced profile', pct: 100, color: '#0d9488' }];
  }

  const sum = raw.reduce((a, b) => a + b.score, 0) || 1;
  const mapped = raw.map(r => ({
    label: r.label,
    pct: (r.score / sum) * 100,
    color: r.color,
  }));
  const t = mapped.reduce((a, b) => a + b.pct, 0) || 1;
  return mapped.map(r => ({
    ...r,
    pct: Math.max(5, Math.round((r.pct / t) * 100)),
  }));
}

export function deriveStrengthsWeaknesses(data: StudentData): {
  strengths: string[];
  weaknesses: string[];
} {
  const labPct = data.labTotal > 0 ? (data.labMarks / data.labTotal) * 100 : 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (labPct >= 80) strengths.push('Strong practical / lab performance');
  if (data.assignmentAverage >= 82) strengths.push('Consistent assignment quality');
  if (data.attendanceRate >= 88) strengths.push('Excellent attendance');
  if ((data.termAssessment1 + data.termAssessment2) / 2 >= 16) strengths.push('Solid term assessment scores');

  if (data.attendanceRate < 72) weaknesses.push('Attendance below target');
  if (data.assignmentAverage < 70) weaknesses.push('Assignment scores need improvement');
  if ((data.termAssessment1 + data.termAssessment2) / 2 < 12) weaknesses.push('Term exams require more preparation');
  if (labPct < 60) weaknesses.push('Lab work needs more focus');

  if (strengths.length === 0) strengths.push('Room to build signature strengths — start with attendance');
  if (weaknesses.length === 0) weaknesses.push('Keep pushing on depth and exam technique');

  return { strengths, weaknesses };
}
