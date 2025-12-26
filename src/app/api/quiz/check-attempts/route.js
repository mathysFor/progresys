import { NextResponse } from "next/server";
import admin from "../../../../lib/firebase/admin.js";

// Get Firestore instance from Admin SDK
const adminDb = admin.firestore();

/**
 * POST /api/quiz/check-attempts
 * Check if an email has already attempted the quiz
 * Body: { email: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Query using Admin SDK (bypasses security rules)
    const attemptsRef = adminDb.collection("quiz_attempts");
    const querySnapshot = await attemptsRef
      .where("email", "==", normalizedEmail)
      .orderBy("startedAt", "desc")
      .get();
    
    const attempts = [];
    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      attempts: attempts,
    });
  } catch (error) {
    console.error("Error checking attempts:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la vérification des tentatives" },
      { status: 500 }
    );
  }
}

