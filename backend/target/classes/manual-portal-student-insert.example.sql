-- Manual roster seed for `portal_student_records` (column names match JPA @Table StoredPortalRecord).
-- The `payload_json` column must be a single JSON object matching `StudentRecordDto` (see Jackson DTOs).
--
-- Notes:
-- 1) Raw SQL bypasses `PortalRecordService.saveTeacherDraft`, so no automatic `app_users` STUDENT row is created.
--    Use the teacher UI “Save” on the roster once, or insert into `app_users` yourself (bcrypt hash for password).
-- 2) The SPA expects `prediction` to exist on each record. Stale numbers are OK for smoke tests; open the student
--    in the roster and save to recompute from the JVM ML stack.
-- 3) Replace `id` / `roll_number` if they already exist (unique constraints).

INSERT INTO portal_student_records (id, roll_number, payload_json)
VALUES (
  'demo-ml-low-001',
  'ML2025001',
  '{
    "id": "demo-ml-low-001",
    "rollNumber": "ML2025001",
    "program": "B.Tech",
    "data": {
      "id": null,
      "name": "At Risk Demo",
      "attendanceRate": 62,
      "assignments": [6, 6.5, 5.5],
      "assignmentAverage": 60,
      "termAssessment1": 11,
      "termAssessment2": 10,
      "labMarks": 12,
      "labTotal": 30,
      "teacherRemark": 5,
      "remarkCaption": "",
      "previousSGPA": 5.2
    },
    "prediction": {
      "student": {
        "id": null,
        "name": "At Risk Demo",
        "attendanceRate": 62,
        "assignments": [6, 6.5, 5.5],
        "assignmentAverage": 60,
        "termAssessment1": 11,
        "termAssessment2": 10,
        "labMarks": 12,
        "labTotal": 30,
        "teacherRemark": 5,
        "remarkCaption": "",
        "previousSGPA": 5.2
      },
      "predictedCGPA": 6.2,
      "predictedFinalExam": 62,
      "riskLevel": "medium",
      "confidence": 0.72,
      "recommendations": [],
      "timestamp": "2026-05-01T12:00:00Z"
    },
    "teacherNarrative": "",
    "improvementActions": [],
    "cgpaSemesters": ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"],
    "cgpaHistory": [5.0, 5.3, 5.7, 5.95, 6.15]
  }'
);

-- Second row — stronger profile (different roll).
INSERT INTO portal_student_records (id, roll_number, payload_json)
VALUES (
  'demo-ml-high-001',
  'ML2025002',
  '{
    "id": "demo-ml-high-001",
    "rollNumber": "ML2025002",
    "program": "B.Tech",
    "data": {
      "id": null,
      "name": "Strong Demo",
      "attendanceRate": 92,
      "assignments": [9, 9.5, 9],
      "assignmentAverage": 91.666667,
      "termAssessment1": 17,
      "termAssessment2": 18,
      "labMarks": 26,
      "labTotal": 30,
      "teacherRemark": 9,
      "remarkCaption": "",
      "previousSGPA": 8.4
    },
    "prediction": {
      "student": {
        "id": null,
        "name": "Strong Demo",
        "attendanceRate": 92,
        "assignments": [9, 9.5, 9],
        "assignmentAverage": 91.666667,
        "termAssessment1": 17,
        "termAssessment2": 18,
        "labMarks": 26,
        "labTotal": 30,
        "teacherRemark": 9,
        "remarkCaption": "",
        "previousSGPA": 8.4
      },
      "predictedCGPA": 8.6,
      "predictedFinalExam": 86,
      "riskLevel": "low",
      "confidence": 0.88,
      "recommendations": [],
      "timestamp": "2026-05-01T12:05:00Z"
    },
    "teacherNarrative": "",
    "improvementActions": [],
    "cgpaSemesters": ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"],
    "cgpaHistory": [7.5, 7.9, 8.15, 8.35, 8.55]
  }'
);
