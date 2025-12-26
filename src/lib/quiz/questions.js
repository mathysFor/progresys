// Quiz questions utilities

/**
 * Validate question data structure
 * @param {Object} question
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateQuestion(question) {
  const errors = [];
  
  if (!question.question || question.question.trim() === "") {
    errors.push("La question est requise");
  }
  
  if (!question.type) {
    errors.push("Le type de question est requis");
  }
  
  if (question.type === "qcm" || question.type === "multiple_choice") {
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      errors.push("Les questions QCM nécessitent au moins 2 options");
    }
    if (question.correctAnswer === undefined || question.correctAnswer === null) {
      errors.push("La réponse correcte est requise pour les QCM");
    }
  }
  
  if (question.type === "true_false") {
    if (question.correctAnswer === undefined || question.correctAnswer === null) {
      errors.push("La réponse correcte est requise (true/false)");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique question ID
 * @returns {string} Question ID
 */
export function generateQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse question from various formats
 * @param {Object} rawQuestion - Raw question data
 * @returns {Object} Normalized question object
 */
export function normalizeQuestion(rawQuestion) {
  return {
    id: rawQuestion.id || generateQuestionId(),
    question: rawQuestion.question || rawQuestion.text || "",
    type: rawQuestion.type || "qcm",
    options: rawQuestion.options || [],
    correctAnswer: rawQuestion.correctAnswer || rawQuestion.answer || null,
    order: rawQuestion.order || 0,
    explanation: rawQuestion.explanation || null,
  };
}

