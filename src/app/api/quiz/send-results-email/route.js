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

    // Log pour déboguer
    console.log('[Quiz Results Email] Request received:', {
      participantEmail,
      score,
      total,
      percentage,
      passed,
      timeSpentSeconds,
      completedAt
    });

    // Validation
    if (!participantEmail || typeof participantEmail !== 'string') {
      console.error('[Quiz Results Email] Validation failed: participantEmail missing');
      return NextResponse.json(
        { error: 'Email du participant requis' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || typeof total !== 'number' || typeof percentage !== 'number') {
      console.error('[Quiz Results Email] Validation failed: invalid score data');
      return NextResponse.json(
        { error: 'Données de score invalides' },
        { status: 400 }
      );
    }

    if (typeof passed !== 'boolean') {
      console.error('[Quiz Results Email] Validation failed: invalid passed status');
      return NextResponse.json(
        { error: 'Statut passé invalide' },
        { status: 400 }
      );
    }

    if (typeof timeSpentSeconds !== 'number') {
      console.error('[Quiz Results Email] Validation failed: invalid timeSpentSeconds');
      return NextResponse.json(
        { error: 'Temps passé invalide' },
        { status: 400 }
      );
    }

    // Vérifier que BREVO_API_KEY est configuré
    if (!process.env.BREVO_API_KEY) {
      console.error('[Quiz Results Email] BREVO_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Configuration email manquante' },
        { status: 500 }
      );
    }

    // Envoyer l'email
    console.log('[Quiz Results Email] Attempting to send email...');
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
      console.error('[Quiz Results Email] Failed to send:', result.error);
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    console.log('[Quiz Results Email] Email sent successfully:', result.messageId);
    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('[Quiz Results Email] Error in API route:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}

