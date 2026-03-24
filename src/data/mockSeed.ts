import type { StudentData } from '../types';

export interface MockSeedRow {
  id: string;
  rollNumber: string;
  program: string;
  teacherNarrative: string;
  /** Pre-built improvement lines (teacher assignments). */
  improvements: string[];
  data: StudentData;
}

export const MOCK_SEED_ROWS: MockSeedRow[] = [
  {
    id: 'stu-arjun-sharma',
    rollNumber: 'CS23B045',
    program: 'B.Tech Computer Science · Year 3',
    teacherNarrative:
      'Arjun shows good grasp in practical sessions. Term assessments are inconsistent — focus on written exam technique. I expect steady improvement if attendance stays above 80%.',
    improvements: [
      'Attend at least 80% of theory classes this month.',
      'Submit all assignments before the deadline — quality over last-minute work.',
      'Join the weekly problem-solving clinic for term exam topics.',
    ],
    data: {
      name: 'Arjun Sharma',
      attendanceRate: 68,
      assignments: [7, 7.5, 8],
      assignmentAverage: 0,
      termAssessment1: 12,
      termAssessment2: 13,
      labMarks: 26,
      labTotal: 30,
      teacherRemark: 7,
      remarkCaption: 'Solid labs; theory needs depth',
      previousSGPA: 6.4,
    },
  },
  {
    id: 'stu-priya-nair',
    rollNumber: 'CS23B012',
    program: 'B.Tech Computer Science · Year 3',
    teacherNarrative:
      'Priya is one of the consistent performers. Encourage peer mentoring — she can reinforce learning by explaining concepts to others.',
    improvements: [
      'Optional: mentor one study group for data structures revision.',
      'Attempt one advanced assignment per unit for depth.',
    ],
    data: {
      name: 'Priya Nair',
      attendanceRate: 94,
      assignments: [9, 9.5, 10, 9],
      assignmentAverage: 0,
      termAssessment1: 18,
      termAssessment2: 19,
      labMarks: 29,
      labTotal: 30,
      teacherRemark: 9,
      remarkCaption: 'Excellent overall engagement',
      previousSGPA: 8.6,
    },
  },
  {
    id: 'stu-rohan-kapoor',
    rollNumber: 'IT23A088',
    program: 'B.Tech Information Technology · Year 2',
    teacherNarrative:
      'Rohan has improved attendance sharply this semester. Maintain momentum on assignments — small gaps remain on documentation quality.',
    improvements: [
      'Use the assignment rubric checklist before every submission.',
      'Keep attendance above 85% through the end term.',
    ],
    data: {
      name: 'Rohan Kapoor',
      attendanceRate: 82,
      assignments: [8, 8, 8.5, 9],
      assignmentAverage: 0,
      termAssessment1: 15,
      termAssessment2: 16,
      labMarks: 24,
      labTotal: 30,
      teacherRemark: 8,
      remarkCaption: 'Improving trend',
      previousSGPA: 7.1,
    },
  },
  {
    id: 'stu-ananya-iyer',
    rollNumber: 'CS23B091',
    program: 'B.Tech Computer Science · Year 3',
    teacherNarrative:
      'Ananya needs structured support. Attendance and assignment submission are the immediate priorities. Please meet me during office hours this week.',
    improvements: [
      'Mandatory: attend at least 75% of classes for the next four weeks.',
      'Complete pending assignments with a day-by-day plan (shared with advisor).',
      'Use the remedial worksheet pack for term assessment topics.',
    ],
    data: {
      name: 'Ananya Iyer',
      attendanceRate: 52,
      assignments: [5, 5.5, 6],
      assignmentAverage: 0,
      termAssessment1: 9,
      termAssessment2: 10,
      labMarks: 14,
      labTotal: 30,
      teacherRemark: 4,
      remarkCaption: 'Requires intervention plan',
      previousSGPA: 5.2,
    },
  },
  {
    id: 'stu-vikram-singh',
    rollNumber: 'ECE23C033',
    program: 'B.Tech Electronics & Communication · Year 3',
    teacherNarrative:
      'Vikram performs well in exams but lab engagement is average. Hands-on practice will help viva and internal components.',
    improvements: [
      'Complete every lab pre-read before the session.',
      'Pair with a lab partner for circuit debugging practice.',
    ],
    data: {
      name: 'Vikram Singh',
      attendanceRate: 78,
      assignments: [8, 7.5, 8],
      assignmentAverage: 0,
      termAssessment1: 16,
      termAssessment2: 15,
      labMarks: 18,
      labTotal: 30,
      teacherRemark: 7,
      remarkCaption: 'Strong tests; labs average',
      previousSGPA: 7.4,
    },
  },
  {
    id: 'stu-kavya-reddy',
    rollNumber: 'CS23B067',
    program: 'B.Tech Computer Science · Year 3',
    teacherNarrative:
      'Kavya has strong assignment scores but attendance drops during project weeks. Plan fixed class slots and avoid skipping core theory.',
    improvements: [
      'No more than 2 unexplained absences per month.',
      'Sync project milestones with the academic calendar I shared.',
    ],
    data: {
      name: 'Kavya Reddy',
      attendanceRate: 71,
      assignments: [9, 8.5, 9, 9],
      assignmentAverage: 0,
      termAssessment1: 14,
      termAssessment2: 15,
      labMarks: 27,
      labTotal: 30,
      teacherRemark: 8,
      remarkCaption: 'Good work; stabilize attendance',
      previousSGPA: 7.8,
    },
  },
  {
    id: 'stu-aditya-menon',
    rollNumber: 'CS23B021',
    program: 'B.Tech Computer Science · Year 3',
    teacherNarrative:
      'Aditya is balanced across components. Push for excellence in term-2 — small gains there will lift predicted CGPA noticeably.',
    improvements: [
      'Target 16+ on Term Assessment 2 — use past papers timed practice.',
      'Maintain current lab performance.',
    ],
    data: {
      name: 'Aditya Menon',
      attendanceRate: 86,
      assignments: [8, 8.5, 8],
      assignmentAverage: 0,
      termAssessment1: 14,
      termAssessment2: 13,
      labMarks: 25,
      labTotal: 30,
      teacherRemark: 8,
      remarkCaption: 'Steady; room to push',
      previousSGPA: 7.2,
    },
  },
];
