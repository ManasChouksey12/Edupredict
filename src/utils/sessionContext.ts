import type { PredictionResult } from '../types';

export function buildSessionContextFromPrediction(p: PredictionResult): string {
  const s = p.student;
  const prev =
    s.previousSGPA != null && !Number.isNaN(s.previousSGPA)
      ? `, prior SGPA ${s.previousSGPA}`
      : '';
  return `Predicted CGPA ${p.predictedCGPA.toFixed(2)}, risk ${p.riskLevel}, expected final-style score ${p.predictedFinalExam}. Attendance ${s.attendanceRate}%, assignment average ${s.assignmentAverage.toFixed(0)}%, term tests ${s.termAssessment1}/20 and ${s.termAssessment2}/20, lab ${s.labMarks}/${s.labTotal}, teacher remark ${s.teacherRemark}/10${prev}.`;
}
