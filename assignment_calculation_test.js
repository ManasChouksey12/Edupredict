// Test the new assignment calculation (out of 10)
const testStudent = {
    name: 'Test Student',
    attendanceRate: 85,
    assignments: [8, 8.5, 9], // 3 assignments out of 10 each
    assignmentAverage: 0, // Will be calculated
    termAssessment1: 16,
    termAssessment2: 17,
    labMarks: 24,
    labTotal: 30,
    teacherRemark: 7,
    remarkCaption: 'Good student',
    previousSGPA: 7.5
};

console.log('NEW CALCULATION (Assignments out of 10):');
console.log('Input assignments:', testStudent.assignments.join(', ') + ' (out of 10 each)');

// Calculate assignment average
const totalObtained = testStudent.assignments.reduce((sum, mark) => sum + mark, 0);
const totalPossible = testStudent.assignments.length * 10;
const assignmentAvgPercent = (totalObtained / totalPossible) * 100;

console.log('Assignment calculation:');
console.log('- Total obtained:', totalObtained);
console.log('- Total possible:', totalPossible);
console.log('- Assignment average:', assignmentAvgPercent.toFixed(1) + '%');

// Expected CGPA calculation:
const attendance = 85;
const term1Percent = (16 / 20) * 100; // 80%
const term2Percent = (17 / 20) * 100; // 85%
const labPercent = (24 / 30) * 100; // 80%
const teacherPercent = (7 / 10) * 100; // 70%
const prevPercent = (7.5 / 10) * 100; // 75%

const weightedPercent =
    attendance * 0.25 +
    assignmentAvgPercent * 0.20 +
    term1Percent * 0.15 +
    term2Percent * 0.15 +
    labPercent * 0.10 +
    teacherPercent * 0.08 +
    prevPercent * 0.07;

const predictedCGPA = (weightedPercent / 100) * 10;

console.log('\nWeighted calculation:');
console.log('- Attendance (85%):', (attendance * 0.25).toFixed(2));
console.log('- Assignment avg (' + assignmentAvgPercent.toFixed(1) + '%):', (assignmentAvgPercent * 0.20).toFixed(2));
console.log('- TA1 (80%):', (term1Percent * 0.15).toFixed(2));
console.log('- TA2 (85%):', (term2Percent * 0.15).toFixed(2));
console.log('- Lab (80%):', (labPercent * 0.10).toFixed(2));
console.log('- Teacher (70%):', (teacherPercent * 0.08).toFixed(2));
console.log('- Previous (75%):', (prevPercent * 0.07).toFixed(2));
console.log('- Weighted total:', weightedPercent.toFixed(2) + '%');
console.log('- Predicted CGPA:', predictedCGPA.toFixed(2));
console.log('- Final exam score:', Math.round(predictedCGPA * 10) + '%');