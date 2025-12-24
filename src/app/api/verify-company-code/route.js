import { NextResponse } from 'next/server';
import admin from '../../../lib/firebase/admin.js';

// Get Firestore instance from Admin SDK
const adminDb = admin.firestore();

export async function POST(request) {
  try {
    const { code, email } = await request.json();
    
    if (!code || !email) {
      return NextResponse.json(
        { error: 'Code et email requis' },
        { status: 400 }
      );
    }
    
    // Normaliser le code (uppercase, sans espaces, sans tirets pour l'ID)
    const normalizedCode = code.toUpperCase().trim().replace(/\s+/g, '').replace(/-/g, '');
    
    // Format attendu: XXX-XX-XX (7 caractères sans tirets)
    if (normalizedCode.length !== 7) {
      return NextResponse.json(
        { error: 'Format de code invalide' },
        { status: 400 }
      );
    }
    
    // Chercher le code dans Firestore (le code sans tirets est l'ID)
    const codeRef = adminDb.collection('company-codes').doc(normalizedCode);
    const codeSnap = await codeRef.get();
    
    if (!codeSnap.exists) {
      return NextResponse.json(
        { error: 'Code invalide' },
        { status: 404 }
      );
    }
    
    const codeData = codeSnap.data();
    
    // Vérifier le statut
    if (codeData.status !== 'active') {
      return NextResponse.json(
        { error: 'Ce code a déjà été utilisé ou a expiré' },
        { status: 400 }
      );
    }
    
    // Vérifier l'email (optionnel mais recommandé)
    if (codeData.email && codeData.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Ce code n\'est pas valide pour cet email' },
        { status: 403 }
      );
    }
    
    // Vérifier l'expiration si applicable
    if (codeData.expiresAt) {
      const expiresAt = codeData.expiresAt.toDate();
      if (expiresAt < new Date()) {
        // Marquer comme expiré
        await codeRef.update({
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return NextResponse.json(
          { error: 'Ce code a expiré' },
          { status: 400 }
        );
      }
    }
    
    // Vérifier que l'entreprise a encore des crédits
    const companyRef = adminDb.collection('companies').doc(codeData.companyId);
    const companySnap = await companyRef.get();
    
    if (!companySnap.exists) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }
    
    const companyData = companySnap.data();
    
    if (companyData.status !== 'active') {
      return NextResponse.json(
        { error: 'L\'entreprise n\'est pas active' },
        { status: 400 }
      );
    }
    
    const remainingCredits = (companyData.credits || 0) - (companyData.usedCredits || 0);
    if (remainingCredits <= 0) {
      return NextResponse.json(
        { error: 'L\'entreprise n\'a plus de crédits disponibles' },
        { status: 400 }
      );
    }
    
    // Code valide ! Retourner les infos (mais ne pas encore marquer comme utilisé)
    // On le marquera comme utilisé lors de la création du compte
    return NextResponse.json({
      valid: true,
      companyId: codeData.companyId,
      codeId: codeSnap.id,
      companyName: companyData.name,
    });
    
  } catch (error) {
    console.error('Error verifying company code:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vérification du code' },
      { status: 500 }
    );
  }
}
