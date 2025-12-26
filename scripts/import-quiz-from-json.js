/**
 * Script to import quiz questions from JSON file to Firestore
 * 
 * Usage: node scripts/import-quiz-from-json.js
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "progresys-35773";
  
  try {
    const serviceAccountPath = path.join(__dirname, "..", "firebase-service-account.json");
    const firebaseAdminPath = path.join(__dirname, "..", "firebase-admin.json");
    let serviceAccount = null;
    
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      console.log("✓ Loaded service account from firebase-service-account.json");
    } else if (fs.existsSync(firebaseAdminPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(firebaseAdminPath, "utf8"));
      console.log("✓ Loaded service account from firebase-admin.json");
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("✓ Loaded service account from environment");
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
      console.log(`✓ Firebase Admin initialized with project: ${projectId}`);
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
      });
      console.log(`✓ Using default Firebase credentials with project: ${projectId}`);
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin:", error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Convert JSON question format to Firestore format
 */
function convertQuestion(jsonQuestion) {
  const order = parseInt(jsonQuestion.id) || 0;
  const questionText = jsonQuestion.question || "";
  
  // Check if it's a True/False question
  const isTrueFalse = jsonQuestion.choices && 
    jsonQuestion.choices.length === 2 &&
    jsonQuestion.choices.some(c => /vrai|true|oui/i.test(c.text)) &&
    jsonQuestion.choices.some(c => /faux|false|non/i.test(c.text));
  
  if (isTrueFalse) {
    // Find which choice is "Vrai" or "True" or "Oui"
    const vraiIndex = jsonQuestion.choices.findIndex(c => 
      /vrai|true|oui/i.test(c.text)
    );
    const isVrai = vraiIndex >= 0 && jsonQuestion.choices[vraiIndex].isCorrect;
    
    return {
      question: questionText,
      type: "true_false",
      options: [],
      correctAnswer: isVrai,
      order: order,
    };
  } else {
    // QCM question
    const options = jsonQuestion.choices.map(c => c.text);
    
    // Check if it's a multiple choice question
    const isMultiple = jsonQuestion.type === "multiple" || 
      (jsonQuestion.correctChoiceIds && jsonQuestion.correctChoiceIds.length > 1);
    
    if (isMultiple) {
      // Find all correct answer indices
      const correctIndices = [];
      jsonQuestion.choices.forEach((choice, index) => {
        if (choice.isCorrect) {
          correctIndices.push(index);
        }
      });
      
      return {
        question: questionText,
        type: "qcm_multiple", // New type for multiple choice
        options: options,
        correctAnswer: correctIndices, // Array of indices
        order: order,
      };
    } else {
      // Single choice question
      const correctIndex = jsonQuestion.choices.findIndex(c => c.isCorrect);
      
      return {
        question: questionText,
        type: "qcm",
        options: options,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        order: order,
      };
    }
  }
}

/**
 * Import questions to Firestore
 */
async function importQuestions(questions) {
  console.log(`\n📥 Importing ${questions.length} questions to Firestore...\n`);
  
  let success = 0;
  let failed = 0;
  const errors = [];
  
  for (const jsonQuestion of questions) {
    try {
      const converted = convertQuestion(jsonQuestion);
      const questionId = `q_${converted.order}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const questionRef = db.collection("quiz_questions").doc(questionId);
      
      await questionRef.set({
        question: converted.question,
        type: converted.type,
        options: converted.options,
        correctAnswer: converted.correctAnswer,
        order: converted.order,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✓ Question ${converted.order}: ${converted.question.substring(0, 60)}...`);
      success++;
    } catch (error) {
      console.error(`✗ Failed to import question ${jsonQuestion.id}:`, error.message);
      failed++;
      errors.push({
        id: jsonQuestion.id,
        question: jsonQuestion.question?.substring(0, 50) || "Unknown",
        error: error.message,
      });
    }
  }
  
  console.log(`\n✅ Import complete: ${success} succeeded, ${failed} failed\n`);
  
  if (errors.length > 0) {
    console.log("Errors:");
    errors.forEach(e => console.log(`  - Question ${e.id}: ${e.error}`));
  }
  
  return { success, failed, errors };
}

/**
 * Main function
 */
async function main() {
  const jsonPath = path.join(__dirname, "..", "quizz_iob_2_v2_final.json");
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    console.log("\nPlease make sure quizz_iob_2_v2_final.json is in the project root directory.");
    process.exit(1);
  }
  
  console.log("📄 Reading quizz_iob_2_v2_final.json...");
  
  try {
    const jsonContent = fs.readFileSync(jsonPath, "utf8");
    const questions = JSON.parse(jsonContent);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("❌ Invalid JSON format. Expected an array of questions.");
      process.exit(1);
    }
    
    console.log(`✅ Found ${questions.length} questions\n`);
    
    // Show preview of first 3 questions
    console.log("Preview of first 3 questions:");
    questions.slice(0, 3).forEach((q, i) => {
      const converted = convertQuestion(q);
      console.log(`\n${i + 1}. ${converted.question}`);
      if (converted.type === "qcm" && converted.options.length > 0) {
        converted.options.forEach((opt, idx) => {
          const marker = idx === converted.correctAnswer ? "✓" : " ";
          console.log(`   ${marker} ${String.fromCharCode(65 + idx)}) ${opt}`);
        });
      } else if (converted.type === "true_false") {
        console.log(`   ${converted.correctAnswer ? "✓ Vrai" : "✓ Faux"}`);
      }
    });
    
    // Ask for confirmation
    console.log(`\n⚠️  This will import ${questions.length} questions to Firestore.`);
    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Import to Firestore
    await importQuestions(questions);
    
    console.log("🎉 Done!");
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertQuestion, importQuestions };

