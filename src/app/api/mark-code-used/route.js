import { NextResponse } from 'next/server';
import admin from '../../../lib/firebase/admin.js';

// Get Firestore instance from Admin SDK
const adminDb = admin.firestore();

export async function POST(request) {
  try {
    const { codeId, userId, formationIds } = await request.json();
    
    if (!codeId || !userId) {
      return NextResponse.json(
        { error: 'codeId et userId requis' },
        { status: 400 }
      );
    }
    
    // Récupérer le code
    const codeRef = adminDb.collection('company-codes').doc(codeId);
    const codeSnap = await codeRef.get();
    
    if (!codeSnap.exists) {
      return NextResponse.json(
        { error: 'Code non trouvé' },
        { status: 404 }
      );
    }
    
    const codeData = codeSnap.data();
    
    if (codeData.status !== 'active') {
      return NextResponse.json(
        { error: 'Code déjà utilisé ou expiré' },
        { status: 400 }
      );
    }
    
    // Marquer le code comme utilisé
    await codeRef.update({
      status: 'used',
      usedBy: userId,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      formationIds: formationIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Décompter le crédit de l'entreprise
    const companyRef = adminDb.collection('companies').doc(codeData.companyId);
    const companySnap = await companyRef.get();
    
    if (companySnap.exists) {
      const companyData = companySnap.data();
      await companyRef.update({
        usedCredits: (companyData.usedCredits || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error marking code as used:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la validation du code' },
      { status: 500 }
    );
  }
}
