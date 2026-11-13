/**
 * GRADE CALCULATOR UTILITY
 *
 * Provides a dynamic, configurable grading engine.
 * Grading scales are not hardcoded in database schemas, allowing
 * different institutions or programs to configure customized grade brackets.
 *
 * Default Scale: Standard Indian University 10-Point CBCS (Choice Based Credit System):
 * ┌───────────┬───────┬─────────────┬──────────────┬────────┐
 * │ Percentage│ Grade │ Grade Point │ Description  │ Status │
 * ├───────────┼───────┼─────────────┼──────────────┼────────┤
 * │ 90 - 100% │  O    │     10      │ Outstanding  │ Passed │
 * │ 80 - 89.9%│  A+   │      9      │ Excellent    │ Passed │
 * │ 70 - 79.9%│  A    │      8      │ Very Good    │ Passed │
 * │ 60 - 69.9%│  B+   │      7      │ Good         │ Passed │
 * │ 55 - 59.9%│  B    │      6      │ Above Average│ Passed │
 * │ 50 - 54.9%│  C    │      5      │ Average      │ Passed │
 * │ 40 - 49.9%│  P    │      4      │ Pass         │ Passed │
 * │ Below 40% │  F    │      0      │ Fail         │ Failed │
 * └───────────┴───────┴─────────────┴──────────────┴────────┘
 */

export const DEFAULT_GRADING_SCALE = [
  { minPercentage: 90, grade: "O",  gradePoint: 10, description: "Outstanding",   isPass: true },
  { minPercentage: 80, grade: "A+", gradePoint: 9,  description: "Excellent",     isPass: true },
  { minPercentage: 70, grade: "A",  gradePoint: 8,  description: "Very Good",     isPass: true },
  { minPercentage: 60, grade: "B+", gradePoint: 7,  description: "Good",          isPass: true },
  { minPercentage: 55, grade: "B",  gradePoint: 6,  description: "Above Average", isPass: true },
  { minPercentage: 50, grade: "C",  gradePoint: 5,  description: "Average",       isPass: true },
  { minPercentage: 40, grade: "P",  gradePoint: 4,  description: "Pass",          isPass: true },
  { minPercentage: 0,  grade: "F",  gradePoint: 0,  description: "Fail",          isPass: false },
];

/**
 * Calculates grade and grade point for a given obtained marks & max marks.
 *
 * @param {number} obtainedMarks - Marks scored by student
 * @param {number} maximumMarks - Max possible marks
 * @param {Array} customScale - Optional custom grading scale
 * @returns {object} { percentage, grade, gradePoint, description, isPassed }
 */
export const calculateGrade = (obtainedMarks, maximumMarks, customScale = DEFAULT_GRADING_SCALE) => {
  if (maximumMarks <= 0) {
    return {
      percentage: 0,
      grade: "F",
      gradePoint: 0,
      description: "Invalid Maximum Marks",
      isPassed: false,
    };
  }

  const percentage = Number(((obtainedMarks / maximumMarks) * 100).toFixed(2));

  // Sort scale descending by minPercentage
  const sortedScale = [...customScale].sort((a, b) => b.minPercentage - a.minPercentage);

  for (const tier of sortedScale) {
    if (percentage >= tier.minPercentage) {
      return {
        percentage,
        grade: tier.grade,
        gradePoint: tier.gradePoint,
        description: tier.description,
        isPassed: tier.isPass,
      };
    }
  }

  // Fallback for edge cases
  return {
    percentage,
    grade: "F",
    gradePoint: 0,
    description: "Fail",
    isPassed: false,
  };
};

/**
 * Computes Semester Grade Point Average (SGPA)
 * Formula: SGPA = (Sum of (Grade Point * Course Credits)) / (Total Course Credits)
 *
 * @param {Array<{ gradePoint: number, credits: number }>} courses
 * @returns {number} SGPA rounded to 2 decimal places
 */
export const calculateSGPA = (courses = []) => {
  let totalCreditPoints = 0;
  let totalCredits = 0;

  for (const course of courses) {
    if (course.credits > 0) {
      totalCreditPoints += (course.gradePoint || 0) * course.credits;
      totalCredits += course.credits;
    }
  }

  if (totalCredits === 0) return 0.0;
  return Number((totalCreditPoints / totalCredits).toFixed(2));
};

