"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkParticipantEmail } from "../../lib/firebase/quiz-participants.js";
import { getAllQuizQuestions } from "../../lib/firebase/quiz-firestore.js";
import {
  createQuizAttempt,
  updateQuizAttempt,
  completeQuizAttempt,
} from "../../lib/firebase/quiz-firestore.js";
import { calculateScore } from "../../lib/quiz/scoring.js";
import { calculateTimeSpent, isTimeExpired } from "../../lib/quiz/timer.js";
import QuizTimer from "../../components/quiz/QuizTimer.js";
import QuizQuestion from "../../components/quiz/QuizQuestion.js";
import QuizResults from "../../components/quiz/QuizResults.js";

const QUIZ_DURATION_SECONDS = 1800; // 30 minutes

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // email, quiz, results
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [results, setResults] = useState(null);
  const [showQuestionNav, setShowQuestionNav] = useState(false);

  // Load questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      const result = await getAllQuizQuestions();
      if (result.error) {
        console.error("Error loading questions:", result.error);
        return;
      }
      if (result.data && result.data.length > 0) {
        setQuestions(result.data);
      }
    };
    loadQuestions();
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError("");

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      setEmailError("Veuillez entrer votre email");
      setIsLoading(false);
      return;
    }

    try {
      // Check if email is authorized
      const checkResult = await checkParticipantEmail(normalizedEmail);
      if (checkResult.error) {
        setEmailError("Erreur lors de la vérification de l'email");
        setIsLoading(false);
        return;
      }

      if (!checkResult.isAuthorized) {
        setEmailError("Votre email n'est pas autorisé à passer ce quiz");
        setIsLoading(false);
        return;
      }

      const participant = checkResult.participant;
      
      // Check existing attempts via API
      const attemptsResponse = await fetch("/api/quiz/check-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      
      if (!attemptsResponse.ok) {
        const errorData = await attemptsResponse.json().catch(() => ({}));
        setEmailError("Erreur lors de la vérification des tentatives");
        setIsLoading(false);
        return;
      }
      
      const attemptsData = await attemptsResponse.json();
      const existingAttempts = attemptsData.attempts || [];
      const completedAttempts = existingAttempts.filter(a => a.completedAt);
      
      // Check if user has already attempted (unless admin allowed retry)
      if (completedAttempts.length > 0 && participant.allowedAttempts <= completedAttempts.length) {
        setEmailError("Vous avez déjà effectué ce quiz. Contactez l'administrateur pour obtenir une deuxième chance.");
        setIsLoading(false);
        return;
      }

      // Check if questions are loaded
      if (questions.length === 0) {
        setEmailError("Les questions ne sont pas encore disponibles. Veuillez réessayer plus tard.");
        setIsLoading(false);
        return;
      }

      // Create new attempt
      const newAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      await createQuizAttempt(newAttemptId, {
        email: normalizedEmail,
        attemptNumber: completedAttempts.length + 1,
        allowedByAdmin: participant.allowedAttempts > 1,
        answers: [],
      });

      setAttemptId(newAttemptId);
      setStartedAt(now);
      setStep("quiz");
    } catch (error) {
      console.error("Error starting quiz:", error);
      setEmailError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Helper to check if a question is multiple choice
  const isMultipleChoice = (question) => {
    return question.type === "qcm_multiple" || 
      (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 1);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId || !startedAt) return;

    setIsLoading(true);

    try {
      // Prepare answers array
      const answersArray = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] !== undefined ? answers[q.id] : null,
      }));

      // Calculate score
      const scoreResult = calculateScore(answersArray, questions);
      
      // Calculate time spent
      const timeSpent = calculateTimeSpent(startedAt);

      // Complete the attempt
      await completeQuizAttempt(attemptId, {
        answers: answersArray,
        score: scoreResult.score,
        total: scoreResult.total,
        percentage: scoreResult.percentage,
        passed: scoreResult.passed,
        timeSpentSeconds: timeSpent,
      });

      setResults(scoreResult);
      setResults((prev) => ({ ...prev, timeSpent }));
      setStep("results");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Erreur lors de la soumission du quiz. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeExpire = async () => {
    // Auto-submit when time expires
    if (step === "quiz" && attemptId) {
      await handleSubmitQuiz();
    }
  };

  // Auto-save answers periodically
  useEffect(() => {
    if (step === "quiz" && attemptId && Object.keys(answers).length > 0) {
      const saveInterval = setInterval(async () => {
        try {
          const answersArray = questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] !== undefined ? answers[q.id] : null,
          }));
          
          await updateQuizAttempt(attemptId, {
            answers: answersArray,
          });
        } catch (error) {
          console.error("Error auto-saving:", error);
        }
      }, 30000); // Save every 30 seconds

      return () => clearInterval(saveInterval);
    }
  }, [step, attemptId, answers, questions]);

  // Email Entry Screen
  if (step === "email") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[60rem] h-[60rem] bg-linear-to-br from-teal-100/60 to-cyan-100/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-linear-to-tr from-cyan-100/60 to-teal-100/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
          
          {/* Dot pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #0d9488 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/25 mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Quiz de Certification
              </h1>
              <p className="text-slate-600">
                Évaluez vos connaissances pour valider votre formation
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
                      required
                    />
                  </div>
                  {emailError && (
                    <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Vérification...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Commencer le quiz
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Info badges */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="text-2xl font-bold text-teal-700 mb-1">30</div>
                  <div className="text-[10px] uppercase tracking-wider text-teal-600 font-medium">minutes</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="text-2xl font-bold text-teal-700 mb-1">70%</div>
                  <div className="text-[10px] uppercase tracking-wider text-teal-600 font-medium">requis</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="text-2xl font-bold text-teal-700 mb-1">{questions.length || "..."}</div>
                  <div className="text-[10px] uppercase tracking-wider text-teal-600 font-medium">questions</div>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-slate-500 text-sm mt-6">
              Une seule tentative autorisée par défaut
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "results" && results) {
    return <QuizResults {...results} timeSpent={results.timeSpent} />;
  }

  if (step === "quiz" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).filter((k) => {
      const answer = answers[k];
      return answer !== null && answer !== undefined && 
        (Array.isArray(answer) ? answer.length > 0 : true);
    }).length;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 relative">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</div>
                  <div className="text-slate-500 text-sm">{answeredCount} répondue{answeredCount > 1 ? "s" : ""}</div>
                </div>
              </div>

              {/* Timer */}
              <QuizTimer
                startedAt={startedAt}
                durationSeconds={QUIZ_DURATION_SECONDS}
                onExpire={handleTimeExpire}
              />
            </div>

            {/* Progress bar */}
            <div className="mt-4 relative">
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 pt-32 pb-32 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Question card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-10">
              {/* Question type badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold uppercase tracking-wider">
                  {currentQuestion.type === "true_false" 
                    ? "Vrai / Faux" 
                    : "QCM"}
                </span>
                {isMultipleChoice(currentQuestion) && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    Plusieurs réponses
                  </span>
                )}
              </div>

              {/* Question text */}
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 leading-relaxed mb-8">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.type === "true_false" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(currentQuestion.id, true)}
                      className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                        answers[currentQuestion.id] === true
                          ? "border-teal-500 bg-teal-50"
                          : "bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        answers[currentQuestion.id] === true
                          ? "bg-teal-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`text-lg font-semibold ${
                        answers[currentQuestion.id] === true
                          ? "text-teal-700"
                          : "text-slate-600"
                      }`}>
                        Vrai
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(currentQuestion.id, false)}
                      className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                        answers[currentQuestion.id] === false
                          ? "border-teal-500 bg-teal-50"
                          : "bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        answers[currentQuestion.id] === false
                          ? "bg-teal-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className={`text-lg font-semibold ${
                        answers[currentQuestion.id] === false
                          ? "text-teal-700"
                          : "text-slate-600"
                      }`}>
                        Faux
                      </span>
                    </button>
                  </div>
                ) : (
                  currentQuestion.options?.map((option, index) => {
                    const isMultiple = isMultipleChoice(currentQuestion);
                    const currentAnswer = answers[currentQuestion.id];
                    const isSelected = isMultiple
                      ? (Array.isArray(currentAnswer) && currentAnswer.includes(index))
                      : (currentAnswer === index);
                    
                    const handleClick = () => {
                      if (isMultiple) {
                        // Toggle the value in the array
                        const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                        const newAnswers = currentAnswers.includes(index)
                          ? currentAnswers.filter(a => a !== index)
                          : [...currentAnswers, index];
                        handleAnswerChange(currentQuestion.id, newAnswers);
                      } else {
                        handleAnswerChange(currentQuestion.id, index);
                      }
                    };
                    
                    return (
                      <button
                        key={index}
                        onClick={handleClick}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-teal-50 border-teal-500 text-slate-900"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        {/* Custom checkbox/radio */}
                        {isMultiple ? (
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                            isSelected 
                              ? "bg-teal-500 border-teal-500" 
                              : "bg-white border-slate-300"
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                            isSelected 
                              ? "border-teal-500" 
                              : "border-slate-300"
                          }`}>
                            {isSelected && (
                              <div className="w-3 h-3 rounded-full bg-teal-500" />
                            )}
                          </div>
                        )}
                        <span className={`flex-1 text-base ${isSelected ? "font-medium" : ""}`}>{option}</span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-teal-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Bottom navigation */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Précédent
              </button>

              {/* Question navigator toggle */}
              <button
                onClick={() => setShowQuestionNav(!showQuestionNav)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm hover:bg-slate-200 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Navigation
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/25"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      Terminer
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/25"
                >
                  Suivant
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </footer>

        {/* Question navigator overlay */}
        {showQuestionNav && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setShowQuestionNav(false)}>
            <div 
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-900 font-semibold">Navigation rapide</h3>
                  <button 
                    onClick={() => setShowQuestionNav(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-2">
                  {questions.map((q, index) => {
                    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                    const isCurrent = index === currentQuestionIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          setShowQuestionNav(false);
                        }}
                        className={`w-full aspect-square rounded-lg font-medium text-sm transition-all ${
                          isCurrent
                            ? "bg-teal-600 text-white ring-2 ring-teal-400 ring-offset-2"
                            : isAnswered
                            ? "bg-teal-100 text-teal-700 border border-teal-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-100 border border-teal-200" />
                    <span className="text-slate-500 text-xs">Répondu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                    <span className="text-slate-500 text-xs">Non répondu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal-600" />
                    <span className="text-slate-500 text-xs">Actuel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
        </div>
        <p className="text-slate-500 font-medium">Chargement du quiz...</p>
      </div>
    </div>
  );
}
