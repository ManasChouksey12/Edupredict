export interface StudentData {
  id?: string;
  name: string;
  attendanceRate: number;
  assignments: number[]; // 3-5 assignments, each out of 10
  assignmentAverage: number; // calculated automatically
  termAssessment1: number; // out of 20
  termAssessment2: number; // out of 20
  labMarks: number; // obtained marks
  labTotal: number; // total marks (20 or 30)
  teacherRemark: number; // out of 10
  remarkCaption?: string; // optional text
  previousSGPA?: number; // out of 10, optional
}

export interface PredictionResult {
  student: StudentData;
  predictedCGPA: number;
  predictedFinalExam: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
  timestamp: Date;
}

export interface ModelMetrics {
  r2Score: number;
  mae: number;
  mse: number;
  accuracy: number;
}