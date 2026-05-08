export interface StudentData {
  id?: string;
  name: string;
  attendanceRate: number;
  assignments: number[];
  assignmentAverage: number;
  termAssessment1: number;
  termAssessment2: number;
  labMarks: number;
  labTotal: number;
  teacherRemark: number;
  remarkCaption?: string;
  previousSGPA?: number;
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
