import type { PredictionResult } from '../types';
import type { CohortInsightPayload } from './geminiExplain';

/** 100% on-device copy — no API, no quota. */
export function buildLocalSingleStudentInsight(result: PredictionResult): string {
  const s = result.student;
  const cgpa = result.predictedCGPA.toFixed(2);
  const exam = result.predictedFinalExam.toFixed(0);
  const risk = result.riskLevel;

  const riskLine =
    risk === 'high'
      ? 'Risk is marked high — early check-ins and concrete support plans usually help most.'
      : risk === 'medium'
        ? 'Risk is medium — steady habits and targeted help on weak areas can move things up.'
        : 'Risk is low — keeping routines and depth on harder topics will help maintain this.';

  const recs =
    result.recommendations.length > 0
      ? result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : '1. Keep steady attendance and review before assessments.';

  return `Here is a plain read on this prediction (everything below uses only the numbers already on your screen).

Predicted CGPA is ${cgpa} out of 10, with an expected final-style score around ${exam}%. ${riskLine}

Focus areas from the app: attendance near ${s.attendanceRate}%, assignment performance around ${s.assignmentAverage.toFixed(0)}% of the scale, term tests ${s.termAssessment1}/20 and ${s.termAssessment2}/20, and lab at roughly ${((s.labMarks / (s.labTotal || 1)) * 100).toFixed(0)}% of the lab total.

Talking points you can reuse:
${recs}`;
}

export function buildLocalCohortInsight(p: CohortInsightPayload): string {
  const { studentCount, avgPredictedCgpa, avgFinalExam, riskHigh, riskMedium, riskLow, factorAverages, context } = p;
  const ctx =
    context === 'csv_batch'
      ? 'this CSV batch'
      : 'everyone in your current session';

  const weakest: string[] = [];
  if (factorAverages.attendancePercent < 75) weakest.push('attendance');
  if (factorAverages.assignmentAvgPercent < 70) weakest.push('assignments');
  if ((factorAverages.term1OutOf20 + factorAverages.term2OutOf20) / 2 < 12) weakest.push('term assessments');
  if (factorAverages.labPercent < 65) weakest.push('lab work');
  const weakStr =
    weakest.length > 0
      ? `Group averages suggest paying extra attention to ${weakest.join(', ')}.`
      : 'Group averages look fairly balanced across the main inputs.';

  return `Here is a cohort read for ${ctx} (${studentCount} students) — all from aggregates already in the app, no cloud needed.

Overall predicted CGPA sits around ${avgPredictedCgpa.toFixed(2)} on average, with typical final-style scores near ${avgFinalExam.toFixed(0)}%. Risk split: ${riskHigh} high, ${riskMedium} medium, ${riskLow} low.

${weakStr}

If you want a simple action order: (1) support anyone flagged high risk first, (2) run a quick review session on the weakest shared factor above, (3) celebrate the strong tail if ${p.gradeBands.excellent_8_5_to_10} students are in the top band.`;
}
