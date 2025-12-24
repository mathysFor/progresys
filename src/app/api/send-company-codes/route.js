import { NextResponse } from 'next/server';
import { sendCompanyCodeEmail } from '../../../lib/services/brevo.js';
import admin, { adminDb } from '../../../lib/firebase/admin.js';

/**
 * Vérifie l'authentification et le statut admin depuis le token Firebase
 * @param {Request} request - Requête HTTP
 * @returns {Promise<{userId: string, isAdmin: boolean, error: null}|{userId: null, isAdmin: false, error: string}>}
 */
async function verifyAdminAuth(request) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null, isAdmin: false, error: 'Token d\'authentification manquant' };
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier le token avec Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Vérifier que l'utilisateur est admin via Firestore Admin
    if (!adminDb) {
      return { userId: null, isAdmin: false, error: 'Firebase Admin non initialisé' };
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { userId: null, isAdmin: false, error: 'Utilisateur non trouvé' };
    }

    const userData = userDoc.data();
    const isAdmin = userData.admin === true;

    if (!isAdmin) {
      return { userId: null, isAdmin: false, error: 'Accès non autorisé. Admin requis.' };
    }

    return { userId, isAdmin: true, error: null };
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return { userId: null, isAdmin: false, error: 'Token invalide ou expiré' };
  }
}

export async function POST(request) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: authResult.error || 'Accès non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer les données de la requête
    const body = await request.json();
    const { companyId, codes } = body;

    // Validation
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId est requis' },
        { status: 400 }
      );
    }

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: 'Une liste de codes est requise' },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'entreprise via Firebase Admin
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin non initialisé' },
        { status: 500 }
      );
    }

    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    const company = { id: companyDoc.id, ...companyDoc.data() };
    const companyName = company.name || '';

    // Envoyer les emails
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const codeData of codes) {
      const { email, code } = codeData;

      if (!email || !code) {
        results.push({
          email: email || 'N/A',
          code: code || 'N/A',
          success: false,
          error: 'Email ou code manquant'
        });
        failureCount++;
        continue;
      }

      // Valider l'email
      if (!email.includes('@')) {
        results.push({
          email,
          code,
          success: false,
          error: 'Email invalide'
        });
        failureCount++;
        continue;
      }

      // Envoyer l'email
      const emailResult = await sendCompanyCodeEmail(email, code, companyName);
      
      if (emailResult.success) {
        results.push({
          email,
          code,
          success: true,
          messageId: emailResult.messageId
        });
        successCount++;
      } else {
        results.push({
          email,
          code,
          success: false,
          error: emailResult.error || 'Erreur lors de l\'envoi'
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: codes.length,
        success: successCount,
        failed: failureCount
      },
      results
    });

  } catch (error) {
    console.error('Error in send-company-codes API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi des emails' },
      { status: 500 }
    );
  }
}

