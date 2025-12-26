"use client";

export default function QuizQuestion({ question, answer, onAnswerChange, questionNumber, totalQuestions }) {
  // Check if this is a multiple choice question
  const isMultiple = question.type === "qcm_multiple" || 
    (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 1);
  
  // Normalize answer to array for multiple choice
  const answerArray = isMultiple 
    ? (Array.isArray(answer) ? answer : answer !== null && answer !== undefined ? [answer] : [])
    : null;

  const handleAnswerChange = (value) => {
    if (onAnswerChange) {
      if (isMultiple) {
        // Toggle the value in the array
        const currentAnswers = answerArray || [];
        const newAnswers = currentAnswers.includes(value)
          ? currentAnswers.filter(a => a !== value)
          : [...currentAnswers, value];
        onAnswerChange(question.id, newAnswers);
      } else {
        // Single choice
        onAnswerChange(question.id, value);
      }
    }
  };

  // Custom checkbox component
  const CustomCheckbox = ({ checked }) => (
    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
      checked 
        ? "bg-teal-500 border-teal-500" 
        : "bg-white border-slate-300"
    }`}>
      {checked && (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );

  // Custom radio component
  const CustomRadio = ({ checked }) => (
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
      checked 
        ? "border-teal-500" 
        : "border-slate-300"
    }`}>
      {checked && (
        <div className="w-3 h-3 rounded-full bg-teal-500" />
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mb-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-teal-600">
          Question {questionNumber} sur {totalQuestions}
        </span>
        {isMultiple && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            Plusieurs réponses
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-6">
        {question.question}
      </h3>

      {question.type === "qcm" || question.type === "qcm_multiple" || question.type === "multiple_choice" ? (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = isMultiple 
              ? (answerArray || []).includes(index)
              : (answer === index || answer === option);
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleAnswerChange(index)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                }`}
              >
                {isMultiple ? (
                  <CustomCheckbox checked={isSelected} />
                ) : (
                  <CustomRadio checked={isSelected} />
                )}
                <span className={`flex-1 ${isSelected ? "text-slate-900 font-medium" : "text-slate-700"}`}>
                  {option}
                </span>
                {isSelected && (
                  <svg className="w-5 h-5 text-teal-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      ) : question.type === "true_false" ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleAnswerChange(true)}
            className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
              answer === true || answer === "true" || answer === "Vrai"
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              answer === true || answer === "true" || answer === "Vrai"
                ? "bg-teal-500 text-white"
                : "bg-slate-100 text-slate-500"
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-lg font-semibold ${
              answer === true || answer === "true" || answer === "Vrai"
                ? "text-teal-700"
                : "text-slate-600"
            }`}>
              Vrai
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => handleAnswerChange(false)}
            className={`flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
              answer === false || answer === "false" || answer === "Faux"
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              answer === false || answer === "false" || answer === "Faux"
                ? "bg-teal-500 text-white"
                : "bg-slate-100 text-slate-500"
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className={`text-lg font-semibold ${
              answer === false || answer === "false" || answer === "Faux"
                ? "text-teal-700"
                : "text-slate-600"
            }`}>
              Faux
            </span>
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={answer || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Votre réponse..."
            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
            rows={4}
          />
        </div>
      )}
    </div>
  );
}
