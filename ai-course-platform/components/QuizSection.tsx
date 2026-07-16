// components/QuizSection.tsx
'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function QuizSection({ lessonContent }: { lessonContent: string }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const generateQuiz = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/generate-quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: lessonContent }),
      })
      if (!response.ok) throw new Error('Failed to generate quiz')
      const data = await response.json()
      setQuiz(data.questions)
      setUserAnswers({})
      setShowResults(false)
    } catch (error) {
      alert("Error generating quiz. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = () => {
    let currentScore = 0
    quiz.forEach((q: any, index: number) => { if (userAnswers[index] === q.correct_answer) currentScore += 1 })
    setScore(currentScore)
    setShowResults(true)
  }

  if (!quiz) {
    return (
      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <button onClick={generateQuiz} disabled={loading} className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-6 py-3 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-50/20 transition disabled:opacity-50 border border-transparent dark:border-indigo-500/20">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '🧠 Generate a Practice Quiz'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-12 p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Knowledge Check</h3>
      
      {quiz.map((q: any, qIndex: number) => (
        <div key={qIndex} className="mb-8">
          <p className="font-medium text-slate-900 dark:text-slate-200 mb-4">{qIndex + 1}. {q.question}</p>
          <div className="space-y-2">
            {(q.options || ['True', 'False']).map((option: string, oIndex: number) => {
              const isSelected = userAnswers[qIndex] === option
              const isCorrect = option === q.correct_answer
              
              let optionClass = "w-full text-left px-4 py-3 rounded-lg border transition "
              if (!showResults) {
                optionClass += isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              } else {
                if (isCorrect) optionClass += "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-400 font-medium"
                else if (isSelected && !isCorrect) optionClass += "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-400"
                else optionClass += "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-50 text-slate-500 dark:text-slate-400"
              }

              return (
                <button key={oIndex} disabled={showResults} onClick={() => setUserAnswers({ ...userAnswers, [qIndex]: option })} className={optionClass}>
                  {option}
                </button>
              )
            })}
          </div>
          
          {showResults && (
            <div className={`mt-3 p-4 rounded-lg text-sm flex items-start gap-2 ${userAnswers[qIndex] === q.correct_answer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
              {userAnswers[qIndex] === q.correct_answer ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <div>
                <span className="font-bold">{userAnswers[qIndex] === q.correct_answer ? 'Correct!' : 'Incorrect.'} </span>
                {q.explanation}
              </div>
            </div>
          )}
        </div>
      ))}

      {!showResults ? (
        <button onClick={submitQuiz} disabled={Object.keys(userAnswers).length !== quiz.length} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition disabled:opacity-50">
          Submit Answers
        </button>
      ) : (
        <div className="text-center mt-6">
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-4">You scored {score} out of {quiz.length}!</p>
          <button onClick={() => { setQuiz(null); setShowResults(false) }} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Take another quiz
          </button>
        </div>
      )}
    </div>
  )
}
