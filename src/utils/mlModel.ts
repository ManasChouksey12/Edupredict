import { StudentData, PredictionResult } from '../types';

// Helper: safe number parse and clamp
const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Deterministic prediction function - NO randomness
export const predictPerformance = (student: StudentData): PredictionResult => {
  // Extract inputs with safe parsing
  const attendance = toNum(student.attendanceRate, 0); // 0-100

  // Assignments array (support 3-5), each out of 50
  const assignments = Array.isArray(student.assignments)
    ? student.assignments.map((a: unknown) => toNum(a, 0))
    : [];

  const assignmentCount = Math.max(0, assignments.length);
  const assignmentSum = assignments.reduce((s, x) => s + x, 0);
  const assignmentAvgPercent =
    assignmentCount > 0 ? (assignmentSum / (assignmentCount * 10)) * 100 : 0;

  // Term assessments (out of 20)
  const term1Percent = (toNum(student.termAssessment1, 0) / 20) * 100;
  const term2Percent = (toNum(student.termAssessment2, 0) / 20) * 100;

  // Lab marks
  const labObtained = toNum(student.labMarks, 0);
  const labTotal = toNum(student.labTotal, 30); // default 30 if not provided
  const labPercent = labTotal > 0 ? (labObtained / labTotal) * 100 : 0;

  // Teacher remark (0-10)
  const teacherPercent = (toNum(student.teacherRemark, 0) / 10) * 100;

  // Previous SGPA (0-10)
  const prevPercent = (toNum(student.previousSGPA, 0) / 10) * 100;

  // Weights (sum to 1.00)
  const w = {
    attendance: 0.25,
    assignment: 0.20,
    term1: 0.15,
    term2: 0.15,
    lab: 0.10,
    teacher: 0.08,
    previous: 0.07,
  };

  // Weighted percentage (0-100) - DETERMINISTIC
  const weightedPercent =
    attendance * w.attendance +
    assignmentAvgPercent * w.assignment +
    term1Percent * w.term1 +
    term2Percent * w.term2 +
    labPercent * w.lab +
    teacherPercent * w.teacher +
    prevPercent * w.previous;

  // Convert to CGPA (0-10) deterministically
  const rawCgpa = (weightedPercent / 100) * 10;
  const predictedCGPA = Math.max(0, Math.min(10, Number(rawCgpa.toFixed(2))));

  // Final exam score (0-100) deterministic
  const finalExamScore = Math.max(
    0,
    Math.min(100, Math.round(predictedCGPA * 10))
  );

  // Deterministic Confidence: base 70 -> 98 based on how many required fields are filled
  const requiredFields = [
    'attendanceRate',
    'assignments',
    'termAssessment1',
    'termAssessment2',
    'labMarks',
    'labTotal',
    'teacherRemark',
  ];
  let filled = 0;
  if (attendance > 0) filled++;
  if (assignmentCount >= 3) filled++; // require at least 3 assignments to consider "filled"
  if (toNum(student.termAssessment1, -1) >= 0) filled++;
  if (toNum(student.termAssessment2, -1) >= 0) filled++;
  if (labTotal > 0 && labObtained >= 0) filled++;
  if (toNum(student.teacherRemark, -1) >= 0) filled++;

  const completeness = Math.min(1, filled / requiredFields.length);
  const confidence = Math.round(70 + completeness * 28) / 100; // deterministic range 0.70-0.98

  // Risk factors (use normalized thresholds)
  const riskFactors = {
    lowAttendance: attendance < 75,
    lowAssignments: assignmentAvgPercent < 70,
    lowTA1: term1Percent < 60,
    lowTA2: term2Percent < 60,
    lowLab: labPercent < 60,
    lowPrevious: prevPercent < 50,
  };
  const riskCount = Object.values(riskFactors).filter(Boolean).length;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskCount >= 4 || predictedCGPA < 4.0) riskLevel = 'high';
  else if (riskCount >= 2 || predictedCGPA < 6.5) riskLevel = 'medium';
  else riskLevel = 'low';

  // Recommendations: deterministic based on risk factors
  const recommendations: string[] = [];
  if (riskFactors.lowAttendance) recommendations.push('Improve attendance to 75%+');
  if (riskFactors.lowAssignments)
    recommendations.push('Improve assignment quality and submission rates');
  if (riskFactors.lowTA1 || riskFactors.lowTA2)
    recommendations.push('Focus on term assessment revision and practice tests');
  if (riskFactors.lowLab) recommendations.push('Improve practical/lab performance');
  if (predictedCGPA < 5) recommendations.push('Consider extra tutoring / mentoring');

  if (recommendations.length === 0) {
    recommendations.push('Continue current performance - maintain consistent study habits and engagement');
  }

  // Update student with calculated assignment average
  const studentWithAverage = {
    ...student,
    assignmentAverage: assignmentAvgPercent
  };

  return {
    student: studentWithAverage,
    predictedCGPA,
    predictedFinalExam: finalExamScore,
    riskLevel,
    confidence,
    recommendations,
    timestamp: new Date(),
  };
};

// Model performance metrics (simulated)
export const getModelMetrics = () => ({
  r2Score: 0.923,
  mae: 0.187,
  mse: 0.045,
  accuracy: 0.952
});