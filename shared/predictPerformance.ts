/**
 * Browser-only heuristic when the API is unavailable (offline / no JWT). The authoritative models run on Spring Boot —
 * supervised OLS + Gaussian Naïve Bayes — see `/api/ml/info` when signed in.
 */

import type { PredictionResult, StudentData } from './types';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function computedAssignmentAveragePercent(assignments: number[]): number {
  if (!assignments.length) return 72;
  const sum = assignments.reduce((a, b) => a + b, 0);
  return (sum / (assignments.length * 10)) * 100;
}

function ensureStudentWithAverages(student: StudentData): StudentData {
  const assignmentAverage = computedAssignmentAveragePercent(student.assignments);
  return {
    ...student,
    assignmentAverage,
  };
}

function countRiskFactors(student: StudentData, assignmentAvgPct: number): number {
  let factors = 0;
  if (student.attendanceRate < 75) factors++;
  if (assignmentAvgPct < 70) factors++;
  const termAvg = (student.termAssessment1 + student.termAssessment2) / 2;
  if (termAvg < 12) factors++;
  const labPct = student.labTotal > 0 ? (student.labMarks / student.labTotal) * 100 : 0;
  if (labPct < 60) factors++;
  if (student.teacherRemark < 5) factors++;
  const prev = student.previousSGPA;
  if (prev != null && prev < 5) factors++;
  return factors;
}

function riskLevelFor(
  cgpa: number,
  riskFactors: number
): 'low' | 'medium' | 'high' {
  if (cgpa < 4 || riskFactors >= 4) return 'high';
  if (cgpa < 6.5 || riskFactors >= 2) return 'medium';
  return 'low';
}

/** Same blended linear proxy used for offline CGPA (not the Spring OLS/GNB stack). */
function heuristicCgpaFromEnriched(studentIn: StudentData): number {
  const prev = studentIn.previousSGPA ?? 7.5;
  const weightedPercent =
    studentIn.attendanceRate * 0.25 +
    studentIn.assignmentAverage * 0.2 +
    (studentIn.termAssessment1 / 20) * 100 * 0.15 +
    (studentIn.termAssessment2 / 20) * 100 * 0.15 +
    (studentIn.labMarks / Math.max(studentIn.labTotal, 1)) * 100 * 0.1 +
    (studentIn.teacherRemark / 10) * 100 * 0.08 +
    (prev / 10) * 100 * 0.07;
  return clamp((weightedPercent / 100) * 10, 0, 10);
}

function cloneStudent(s: StudentData): StudentData {
  return {
    ...s,
    assignments: [...(s.assignments ?? [])],
  };
}

/**
 * One-at-a-time finite-difference lifts on the offline heuristic surface (mirrors server counterfactual strategy).
 * Wording is numeric only — no static rubric advice.
 */
function buildCounterfactualRecommendationsOffline(studentIn: StudentData): string[] {
  const baseline = heuristicCgpaFromEnriched(studentIn);
  const riskFactors = countRiskFactors(studentIn, studentIn.assignmentAverage);

  const out: string[] = [
    `Offline blended-score CGPA ${baseline.toFixed(3)}; heuristic risk flags counted: ${riskFactors} (API mode uses OLS + Gaussian NB).`,
  ];

  type Cf = { label: string; delta: number };
  const ranked: Cf[] = [];

  const tryCf = (label: string, apply: (d: StudentData) => void) => {
    const c = cloneStudent(studentIn);
    apply(c);
    const enriched = ensureStudentWithAverages(c);
    const y = heuristicCgpaFromEnriched(enriched);
    const delta = y - baseline;
    if (delta > 1e-4) ranked.push({ label, delta });
  };

  tryCf('attendance +4 points (capped at 99)', (d) => {
    d.attendanceRate = clamp(d.attendanceRate + 4, 0, 99);
  });
  tryCf('each assignment mark +0.5 (capped at 10)', (d) => {
    if (!d.assignments?.length) return;
    d.assignments = d.assignments.map((m) => clamp(m + 0.5, 0, 10));
  });
  tryCf('each term assessment +1.5 marks (capped at 20)', (d) => {
    d.termAssessment1 = clamp(d.termAssessment1 + 1.5, 0, 20);
    d.termAssessment2 = clamp(d.termAssessment2 + 1.5, 0, 20);
  });
  tryCf('lab marks +max(1, 7% of lab total) (capped at total)', (d) => {
    const step = Math.max(1, d.labTotal * 0.07);
    d.labMarks = clamp(d.labMarks + step, 0, d.labTotal);
  });
  tryCf('teacher remark +0.7 (capped at 10)', (d) => {
    d.teacherRemark = clamp(d.teacherRemark + 0.7, 0, 10);
  });
  tryCf('prior SGPA +0.55 (or fixed 7.9 if previously unset)', (d) => {
    if (d.previousSGPA != null) d.previousSGPA = clamp(d.previousSGPA + 0.55, 0, 10);
    else d.previousSGPA = 7.9;
  });

  ranked.sort((a, b) => b.delta - a.delta);
  const top = ranked.slice(0, 6);
  for (const c of top) {
    out.push(
      `Single-perturbation counterfactual (${c.label}): blended-score CGPA lift +${c.delta.toFixed(3)} vs baseline.`
    );
  }

  if (!ranked.length) {
    out.push(
      `Probed marginal nudges yielded no blended-score CGPA increase above baseline ${baseline.toFixed(3)} (flat or clipped).`
    );
  }

  out.push(
    'Method: independent one-at-a-time probes on the browser heuristic (sign in for JVM-fitted OLS + NB posteriors).'
  );
  return out;
}

function confidencePct(cgpa: number, riskFactors: number): number {
  const spreadPen = Math.abs(7.5 - cgpa);
  let c = 88 - riskFactors * 9 - spreadPen * 3;
  c = clamp(c, 54, 96);
  return Math.round(c);
}

/** Feature vector helper for exporting to external ML tooling. */
export function studentFeaturesForMl(student: StudentData): number[] {
  const s = ensureStudentWithAverages(student);
  const assignmentAvgPct = s.assignmentAverage;
  const labPct = student.labTotal > 0 ? (student.labMarks / student.labTotal) * 100 : 0;
  const prev = student.previousSGPA ?? 7.5;
  return [
    student.attendanceRate,
    assignmentAvgPct,
    student.termAssessment1,
    student.termAssessment2,
    labPct,
    student.teacherRemark,
    prev,
  ];
}

export function predictPerformance(raw: StudentData): PredictionResult {
  const studentIn = ensureStudentWithAverages(raw);

  const predictedCGPA = heuristicCgpaFromEnriched(studentIn);
  const predictedFinalExam = Math.round(predictedCGPA * 10);
  const riskFactors = countRiskFactors(studentIn, studentIn.assignmentAverage);
  const riskLevel = riskLevelFor(predictedCGPA, riskFactors);
  const recommendations = buildCounterfactualRecommendationsOffline(studentIn);
  const confidence = confidencePct(predictedCGPA, riskFactors);

  return {
    student: studentIn,
    predictedCGPA,
    predictedFinalExam,
    riskLevel,
    confidence,
    recommendations,
    timestamp: new Date(),
  };
}
