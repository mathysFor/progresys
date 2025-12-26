import { NextResponse } from "next/server";
import { getAllQuizQuestions, saveQuizQuestion } from "../../../../lib/firebase/quiz-firestore.js";
import { normalizeQuestion } from "../../../../lib/quiz/questions.js";

/**
 * POST /api/quiz/import-questions
 * Import questions from JSON array
 * Body: { questions: Array<{question, type, options, correctAnswer, order}> }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid request. Expected 'questions' array." },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const questionData of questions) {
      try {
        const normalized = normalizeQuestion(questionData);
        const questionId = questionData.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const result = await saveQuizQuestion(questionId, normalized);
        if (result.error) {
          results.failed++;
          results.errors.push({
            question: questionData.question?.substring(0, 50) || "Unknown",
            error: result.error,
          });
        } else {
          results.success++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          question: questionData.question?.substring(0, 50) || "Unknown",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error importing questions:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'import des questions" },
      { status: 500 }
    );
  }
}

