/**
 * Script to import quiz questions from quizz.docx to Firestore
 * 
 * Usage: node scripts/import-quiz-questions.js
 * 
 * Requirements:
 * - Install mammoth: npm install mammoth
 * - Set up Firebase Admin SDK credentials
 */

const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Get project ID from environment or use default
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "progresys-35773";
  
  try {
    // Try to load service account from file first
    const serviceAccountPath = path.join(__dirname, "..", "firebase-service-account.json");
    let serviceAccount = null;
    
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      console.log("✓ Loaded service account from file");
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
      // Try default credentials
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId,
        });
        console.log(`✓ Using default Firebase credentials with project: ${projectId}`);
      } catch (defaultError) {
        throw new Error(`Failed to initialize with default credentials: ${defaultError.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin:", error.message);
    console.log("\n📋 Solutions:");
    console.log("1. Run: firebase login");
    console.log("2. Or place firebase-service-account.json in project root");
    console.log("3. Or set FIREBASE_SERVICE_ACCOUNT environment variable");
    console.log("\nTo create a service account:");
    console.log("1. Go to Firebase Console > Project Settings > Service Accounts");
    console.log("2. Click 'Generate New Private Key'");
    console.log("3. Save the JSON file as 'firebase-service-account.json' in project root");
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Parse question text and extract question data
 * Expected format examples:
 * - "1. Question text? A) Option 1 B) Option 2 C) Option 3 D) Option 4 Réponse: A"
 * - "1. Question text? Vrai/Faux Réponse: Vrai"
 */
function parseQuestion(text, questionNumber) {
  // Remove question number prefix if present
  let cleanText = text.replace(/^\d+[\.\)]\s*/, "").trim();
  
  // Try to detect question type
  const isTrueFalse = /vrai\s*\/\s*faux|true\s*\/\s*false/i.test(cleanText);
  
  if (isTrueFalse) {
    // True/False question
    const questionMatch = cleanText.match(/^(.+?)\s*(?:vrai\s*\/\s*faux|true\s*\/\s*false).*?[Rr]éponse[:\s]+(vrai|faux|true|false)/i);
    if (questionMatch) {
      return {
        question: questionMatch[1].trim(),
        type: "true_false",
        options: [],
        correctAnswer: /vrai|true/i.test(questionMatch[2]),
        order: questionNumber,
      };
    }
  } else {
    // QCM question
    // Try to extract options (A, B, C, D format)
    const optionRegex = /([A-D])[\)\.]\s*([^A-D]+?)(?=[A-D][\)\.]|$|Réponse)/gi;
    const options = [];
    let match;
    
    while ((match = optionRegex.exec(cleanText)) !== null) {
      options.push(match[2].trim());
    }
    
    // Extract correct answer
    const answerMatch = cleanText.match(/[Rr]éponse[:\s]+([A-D])/i);
    const correctAnswerIndex = answerMatch
      ? answerMatch[1].charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
      : 0;
    
    // Extract question text (everything before the first option)
    const questionText = cleanText
      .split(/[A-D][\)\.]/)[0]
      .replace(/[Rr]éponse.*$/i, "")
      .trim();
    
    if (questionText && options.length >= 2) {
      return {
        question: questionText,
        type: "qcm",
        options: options,
        correctAnswer: correctAnswerIndex,
        order: questionNumber,
      };
    }
  }
  
  // Fallback: if we can't parse, return the raw text as question
  return {
    question: cleanText.replace(/[Rr]éponse.*$/i, "").trim(),
    type: "qcm",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    correctAnswer: 0,
    order: questionNumber,
  };
}

/**
 * Extract questions from docx text
 */
function extractQuestions(text) {
  const questions = [];
  
  // Split by lines and process
  const lines = text.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion = null;
  let questionNumber = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line starts with a number (likely a new question)
    const numberMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
    
    if (numberMatch) {
      // Save previous question if exists
      if (currentQuestion) {
        const parsed = parseQuestion(currentQuestion, questionNumber);
        if (parsed.question) {
          questions.push(parsed);
          questionNumber++;
        }
      }
      
      // Start new question
      currentQuestion = numberMatch[2];
    } else if (currentQuestion) {
      // Continue current question
      currentQuestion += " " + line;
    } else {
      // Might be first question without number
      if (line.length > 10 && !currentQuestion) {
        currentQuestion = line;
      }
    }
  }
  
  // Don't forget the last question
  if (currentQuestion) {
    const parsed = parseQuestion(currentQuestion, questionNumber);
    if (parsed.question) {
      questions.push(parsed);
    }
  }
  
  return questions;
}

/**
 * Import questions to Firestore
 */
async function importQuestions(questions) {
  console.log(`\nImporting ${questions.length} questions to Firestore...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const question of questions) {
    try {
      const questionId = `q_${question.order}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const questionRef = db.collection("quiz_questions").doc(questionId);
      
      await questionRef.set({
        question: question.question,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        order: question.order,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✓ Question ${question.order}: ${question.question.substring(0, 50)}...`);
      success++;
    } catch (error) {
      console.error(`✗ Failed to import question ${question.order}:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n✅ Import complete: ${success} succeeded, ${failed} failed\n`);
  return { success, failed };
}

/**
 * Main function
 */
async function main() {
  const docxPath = path.join(__dirname, "..", "quizz.docx");
  
  if (!fs.existsSync(docxPath)) {
    console.error(`❌ File not found: ${docxPath}`);
    console.log("\nPlease make sure quizz.docx is in the project root directory.");
    process.exit(1);
  }
  
  console.log("📄 Reading quizz.docx...");
  
  try {
    // Extract text from docx
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;
    
    console.log("📝 Extracting questions...");
    
    // Extract questions
    const questions = extractQuestions(text);
    
    if (questions.length === 0) {
      console.error("❌ No questions found in the document.");
      console.log("\nThe document might be in an unexpected format.");
      console.log("Please check the format and try again, or add questions manually via the admin interface.");
      process.exit(1);
    }
    
    console.log(`✅ Found ${questions.length} questions\n`);
    
    // Show preview of first few questions
    console.log("Preview of first 3 questions:");
    questions.slice(0, 3).forEach((q, i) => {
      console.log(`\n${i + 1}. ${q.question}`);
      if (q.type === "qcm" && q.options.length > 0) {
        q.options.forEach((opt, idx) => {
          const marker = idx === q.correctAnswer ? "✓" : " ";
          console.log(`   ${marker} ${String.fromCharCode(65 + idx)}) ${opt}`);
        });
      } else if (q.type === "true_false") {
        console.log(`   ${q.correctAnswer ? "✓ Vrai" : "✓ Faux"}`);
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

module.exports = { extractQuestions, importQuestions };

