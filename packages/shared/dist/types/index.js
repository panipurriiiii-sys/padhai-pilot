export * from './analytics.js';
export function calculateGradeAndPercentage(obtainedMarks, maxMarks) {
    if (obtainedMarks === null || obtainedMarks === undefined || maxMarks <= 0) {
        return { percentage: null, grade: null };
    }
    const percentage = Math.round((obtainedMarks / maxMarks) * 100 * 10) / 10;
    let grade = 'F';
    if (percentage >= 90)
        grade = 'A+';
    else if (percentage >= 80)
        grade = 'A';
    else if (percentage >= 70)
        grade = 'B+';
    else if (percentage >= 60)
        grade = 'B';
    else if (percentage >= 50)
        grade = 'C';
    else if (percentage >= 40)
        grade = 'D';
    else
        grade = 'F';
    return { percentage, grade };
}
export * from './features.js';
export * from './tuition.js';
export * from './student.js';
export * from './academic.js';
export * from './analytics.js';
