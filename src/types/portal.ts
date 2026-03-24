import type { StudentData, PredictionResult } from './index';

export type PortalRole = 'teacher' | 'student';

export interface ImprovementAction {
  id: string;
  text: string;
}

/** One row in the institution portal — teacher-managed, student-visible. */
export interface StudentRecord {
  id: string;
  rollNumber: string;
  program: string;
  data: StudentData;
  prediction: PredictionResult;
  /** Long-form note from teacher — shown on student dashboard. */
  teacherNarrative: string;
  /** Action items teacher assigns for the student. */
  improvementActions: ImprovementAction[];
  /** Semester labels for the trend chart (mock history ending at current predicted CGPA). */
  cgpaSemesters: string[];
  cgpaHistory: number[];
}

export interface SerializedPredictionResult extends Omit<PredictionResult, 'timestamp'> {
  timestamp: string;
}

export interface SerializedStudentRecord extends Omit<StudentRecord, 'prediction'> {
  prediction: SerializedPredictionResult;
}
