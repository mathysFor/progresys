import { NextResponse } from 'next/server';
import { sendQuizResultsEmail } from '../../../../lib/services/brevo.js';

/**
 * Test route to verify email sending functionality
 * GET /api/quiz/test-email
 */
export async function GET() {
  try {
    console.log('[Test Email] Starting email test...');
    
    // Check if BREVO_API_KEY is configured
    if (!process.env.BREVO_API_KEY) {
      console.error('[Test Email] BREVO_API_KEY is not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'BREVO_API_KEY is not configured in environment variables' 
        },
        { status: 500 }
      );
    }

    console.log('[Test Email] BREVO_API_KEY is configured');
    console.log('[Test Email] BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || 'not set');
    console.log('[Test Email] BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME || 'not set');

    // Test avec des données fictives
    const testData = {
      participantEmail: 'test@example.com',
      score: 70,
      total: 80,
      percentage: 87.5,
      passed: true,
      timeSpentSeconds: 1200, // 20 minutes
      completedAt: new Date().toISOString()
    };

    console.log('[Test Email] Sending test email with data:', testData);
    
    const result = await sendQuizResultsEmail(
      testData.participantEmail,
      testData.score,
      testData.total,
      testData.percentage,
      testData.passed,
      testData.timeSpentSeconds,
      testData.completedAt
    );
    
    if (result.success) {
      console.log('[Test Email] Email sent successfully:', result.messageId);
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: result.messageId,
        testData 
      });
    } else {
      console.error('[Test Email] Failed to send email:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Unknown error',
          testData 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Test Email] Error in test route:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

