import { NextResponse } from 'next/server';
import { sendQuizResultsEmail } from '../../../../lib/services/brevo.js';

/**
 * Send quiz results email to administrator
 * POST /api/quiz/send-results-email
 * Body: { participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { participantEmail, score, total, percentage, passed, timeSpentSeconds, completedAt } = body;

    // Validation
    if (!participantEmail || typeof participantEmail !== 'string') {
      return NextResponse.json(
        { error: 'Email du participant requis' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || typeof total !== 'number' || typeof percentage !== 'number') {
      return NextResponse.json(
        { error: 'Données de score invalides' },
        { status: 400 }
      );
    }

    if (typeof passed !== 'boolean') {
      return NextResponse.json(
        { error: 'Statut passé invalide' },
        { status: 400 }
      );
    }

    if (typeof timeSpentSeconds !== 'number') {
      return NextResponse.json(
        { error: 'Temps passé invalide' },
        { status: 400 }
      );
    }

    // Envoyer l'email
    const result = await sendQuizResultsEmail(
      participantEmail,
      score,
      total,
      percentage,
      passed,
      timeSpentSeconds,
      completedAt || new Date().toISOString()
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error in send-results-email API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}

