import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase/admin.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Search for user by email in Firestore using Admin SDK
    // Admin SDK bypasses Firestore security rules
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json({ 
        exists: false,
        userId: null
      });
    }

    // Email exists, return the first user's ID
    const userDoc = querySnapshot.docs[0];
    return NextResponse.json({ 
      exists: true,
      userId: userDoc.id
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check email' },
      { status: 500 }
    );
  }
}



