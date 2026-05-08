-- Teacher login only. Student accounts are created automatically when a teacher adds roster rows
-- (username = roll number, initial password = roll number).
INSERT INTO app_users (username, password_hash, role, student_roll)
SELECT 'teacher', '$2a$10$7THfQyyldhnQygZ0m5rv5O1MTOTh3gV9BMA1DJKeAkp./tVXhYd.G', 'TEACHER', NULL
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'teacher');
