// components/FlashcardSection.tsx
'use client'

import { useState } from 'react'
import { Loader2, Layers, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react'

export default function FlashcardSection({ lessonContent }: { lessonContent: string }) {
  const [flashcards, setFlashcards] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const generateFlashcards = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://ai-course-platform-i10p.onrender.com/api/generate-flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: lessonContent }),
      })
      if (!response.ok) throw new Error('Failed to generate flashcards')
      const data = await response.json()
      setFlashcards(data.flashcards)
      setCurrentIndex(0)
      setIsFlipped(false)
    } catch (error) {
      alert("Error generating flashcards. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1)), 150) }
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => Math.max(prev - 1, 0)), 150) }

  if (!flashcards) {
    return (
      <div className="mt-6">
        <button onClick={generateFlashcards} disabled={loading} className="flex items-center gap-2 bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 px-6 py-3 rounded-xl font-medium hover:bg-violet-200 dark:hover:bg-violet-500/20 transition disabled:opacity-50 border border-violet-200 dark:border-violet-500/20">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Layers className="w-5 h-5" /> Generate AI Flashcards</>}
        </button>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]

  return (
    <div className="mt-12 p-8 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-3xl transition-colors w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-violet-500 dark:text-violet-400" /> Key Terms Flashcards
        </h3>
        <span className="text-sm font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">
          {currentIndex + 1} / {flashcards.length}
        </span>
      </div>
      
      <div className="perspective-1000 relative w-full h-64 md:h-80 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`w-full h-full transition-all duration-500 rounded-2xl shadow-md border flex items-center justify-center p-8 text-center
            ${!isFlipped ? 'bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-800/50 shadow-violet-100 dark:shadow-none' : 'bg-violet-600 text-white border-violet-700 dark:border-violet-500'}`}>
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <h4 className={`text-xl md:text-2xl font-semibold leading-relaxed ${!isFlipped ? 'text-slate-800 dark:text-slate-100' : 'text-white'}`}>
              {!isFlipped ? currentCard.front : currentCard.back}
            </h4>
            <p className={`text-xs uppercase tracking-widest font-bold mt-4 flex items-center gap-1 ${!isFlipped ? 'text-violet-400 dark:text-violet-500' : 'text-violet-300'}`}>
              <RotateCcw className="w-3 h-3" /> Click to flip
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button onClick={prevCard} disabled={currentIndex === 0} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition shadow-sm">
          <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex gap-2">
          {flashcards.map((_: any, i: number) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentIndex ? 'bg-violet-500' : 'bg-violet-200 dark:bg-slate-700'}`} />
          ))}
        </div>
        <button onClick={nextCard} disabled={currentIndex === flashcards.length - 1} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition shadow-sm">
          <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  )
}
