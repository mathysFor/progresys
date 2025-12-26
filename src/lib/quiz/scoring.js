// Quiz scoring utilities
import { getAllQuizQuestions } from "../firebase/quiz-firestore.js";

/**
 * Calculate quiz score
 * @param {Array} answers - Array of { questionId, answer }
 * @param {Array} questions - Array of question objects with correctAnswer
 * @returns {Object} { score, total, percentage, passed }
 */
export function calculateScore(answers, questions) {
  let correctCount = 0;
  const totalQuestions = questions.length;
  
  // Create a map of questions by ID for quick lookup
  const questionsMap = new Map();
  questions.forEach((q) => {
    questionsMap.set(q.id, q);
  });
  
  // Check each answer
  answers.forEach((answer) => {
    const question = questionsMap.get(answer.questionId);
    if (!question) return;
    
    // Handle different question types
    if (question.type === "qcm_multiple" || 
        (question.type === "qcm" && Array.isArray(question.correctAnswer))) {
      // Multiple choice question - check if all correct answers are selected
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      const userAnswers = Array.isArray(answer.answer) 
        ? answer.answer 
        : (answer.answer !== null && answer.answer !== undefined ? [answer.answer] : []);
      
      // Sort arrays for comparison
      const sortedCorrect = [...correctAnswers].sort((a, b) => a - b);
      const sortedUser = [...userAnswers].sort((a, b) => a - b);
      
      // Check if arrays are equal (same length and same values)
      if (sortedCorrect.length === sortedUser.length &&
          sortedCorrect.every((val, idx) => val === sortedUser[idx])) {
        correctCount++;
      }
    } else if (question.type === "qcm" || question.type === "multiple_choice") {
      // Single choice QCM
      if (answer.answer === question.correctAnswer) {
        correctCount++;
      }
    } else if (question.type === "true_false") {
      // For true/false, compare boolean or string
      const userAnswer = String(answer.answer).toLowerCase();
      const correctAnswer = String(question.correctAnswer).toLowerCase();
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    } else {
      // For other types, direct comparison
      if (String(answer.answer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim()) {
        correctCount++;
      }
    }
  });
  
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = percentage >= 70; // 70% minimum to pass
  
  return {
    score: correctCount,
    total: totalQuestions,
    percentage,
    passed,
  };
}

/**
 * Calculate score from attempt data
 * @param {Object} attempt - Attempt object with answers array
 * @param {Array} questions - Array of question objects
 * @returns {Object} Score result
 */
export async function calculateScoreFromAttempt(attempt, questions) {
  if (!attempt.answers || !Array.isArray(attempt.answers)) {
    return {
      score: 0,
      total: questions.length,
      percentage: 0,
      passed: false,
    };
  }
  
  return calculateScore(attempt.answers, questions);
}
