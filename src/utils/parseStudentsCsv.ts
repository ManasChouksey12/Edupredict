import type { StudentData } from '../types';

export interface ParsedCsvRow {
  data: StudentData;
  rollNumber?: string;
  program?: string;
}

/** Minimal CSV parser (same shape as batch template). Optional columns: rollNumber, program */
export function parseStudentsCsv(csvText: string): ParsedCsvRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    const student: Partial<StudentData> & { assignments: number[]; assignmentAverage: number } = {
      assignments: [],
      assignmentAverage: 0,
    };
    let rollNumber: string | undefined;
    let program: string | undefined;

    headers.forEach((header, i) => {
      const value = values[i];
      if (header.startsWith('assignment') && value && value !== '') {
        student.assignments.push(parseFloat(value) || 0);
      } else {
        switch (header) {
          case 'name':
            student.name = value;
            break;
          case 'rollNumber':
            rollNumber = value || undefined;
            break;
          case 'program':
            program = value || undefined;
            break;
          case 'attendanceRate':
            student.attendanceRate = parseFloat(value) || 0;
            break;
          case 'termAssessment1':
            student.termAssessment1 = parseFloat(value) || 0;
            break;
          case 'termAssessment2':
            student.termAssessment2 = parseFloat(value) || 0;
            break;
          case 'labMarks':
            student.labMarks = parseFloat(value) || 0;
            break;
          case 'labTotal':
            student.labTotal = parseFloat(value) || 0;
            break;
          case 'teacherRemark':
            student.teacherRemark = parseFloat(value) || 0;
            break;
          case 'previousSGPA':
            student.previousSGPA = value && value !== '' ? parseFloat(value) : undefined;
            break;
          case 'remarkCaption':
            student.remarkCaption = value || '';
            break;
        }
      }
    });

    if (student.assignments.length > 0) {
      const totalObtained = student.assignments.reduce((s, m) => s + m, 0);
      student.assignmentAverage = (totalObtained / (student.assignments.length * 10)) * 100;
    }

    student.id = `csv_${index + 1}`;
    return {
      data: student as StudentData,
      rollNumber,
      program,
    };
  });
}
