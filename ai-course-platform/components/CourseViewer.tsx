// components/CourseViewer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Circle, X, Send, Loader2, Sparkles, Bot, User, ArrowLeft, BookOpen, Volume2, Square, Award, Menu } from 'lucide-react'
import QuizSection from './QuizSection'
import FlashcardSection from './FlashcardSection'
import Link from 'next/link'

export default function CourseViewer({ course, chapters, userId }: any) {
  const firstLesson = chapters[0]?.lessons?.[0]
  const [activeLesson, setActiveLesson] = useState(firstLesson)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile Sidebar State
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])
  const [isChatting, setIsChatting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Calculate Progress
  const totalLessons = chapters.reduce((acc: number, chapter: any) => acc + chapter.lessons.length, 0)
  const courseLessonIds = chapters.flatMap((c: any) => c.lessons.map((l: any) => l.id))
  const completedInThisCourse = courseLessonIds.filter((id: string) => completedLessons.has(id)).length
  const progressPercentage = totalLessons === 0 ? 0 : Math.min(100, Math.round((completedInThisCourse / totalLessons) * 100))

  useEffect(() => {
    const fetchProgress = async () => {
      const { data } = await supabase.from('progress').select('lesson_id').eq('user_id', userId).eq('is_completed', true)
      if (data) setCompletedLessons(new Set(data.map((p) => p.lesson_id)))
    }
    fetchProgress()
  }, [userId, supabase])

  // Reset UI on lesson change
  useEffect(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsSidebarOpen(false) // Close sidebar on mobile when lesson selected
  }, [activeLesson])

  const handleMarkComplete = async () => {
    if (!activeLesson || completedLessons.has(activeLesson.id)) return
    setLoadingComplete(true)
    try {
      await supabase.from('progress').insert({ user_id: userId, lesson_id: activeLesson.id, is_completed: true, completed_at: new Date().toISOString() })
      setCompletedLessons((prev) => new Set(prev).add(activeLesson.id))
    } catch (error) { alert("Error saving progress") } 
    finally { setLoadingComplete(false) }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isChatting) return
    const userMsg = { role: 'user', content: chatInput }; setChatHistory((prev) => [...prev, userMsg]); setChatInput(''); setIsChatting(true)
    try {
      const response = await fetch('https://ai-course-platform-i10p.onrender.com/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatHistory, userMsg], context: activeLesson.content }),
      })
      const data = await response.json()
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) { setChatHistory((prev) => [...prev, { role: 'assistant', content: "Error connecting to AI." }]) }
    finally { setIsChatting(false) }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
      
      {/* MOBILE HEADER - Only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{course.title}</span>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* SIDEBAR - Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center lg:block">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4 font-medium">
              <ArrowLeft className="w-4 h-4" /> Library
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mt-2">{course.title}</h2>
          <div className="mt-6">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span>Progress</span>
              <span className="text-indigo-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-700" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {chapters.map((chapter: any) => (
            <div key={chapter.id} className="mb-6">
              <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest ml-3 mb-2">{chapter.title}</h3>
              <ul className="space-y-1">
                {chapter.lessons.map((lesson: any) => (
                  <li key={lesson.id}>
                    <button onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      activeLesson?.id === lesson.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}>
                      {completedLessons.has(lesson.id) ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                      <span className="truncate">{lesson.lesson_order}. {lesson.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 overflow-y-auto p-6 md:p-16 pt-24 lg:pt-16 scroll-smooth transition-all ${isChatOpen ? 'lg:mr-[400px]' : 'mr-0'}`}>
        <div className="max-w-3xl mx-auto pb-20">
          {activeLesson ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold tracking-widest uppercase border border-indigo-100 dark:border-indigo-800">
                  Lesson {activeLesson.lesson_order}
                </div>
                <button onClick={() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(activeLesson.content))} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                  <Volume2 className="w-4 h-4" /> Read Aloud
                </button>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">{activeLesson.title}</h1>
              <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300">
                <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
              </div>
              
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleMarkComplete} disabled={loadingComplete || completedLessons.has(activeLesson.id)} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                  completedLessons.has(activeLesson.id) ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100' : 'bg-slate-900 dark:bg-indigo-600 text-white hover:scale-105'
                }`}>
                  {completedLessons.has(activeLesson.id) ? <><CheckCircle className="w-5 h-5" /> Completed</> : 'Mark as Complete'}
                </button>
              </div>
              <FlashcardSection lessonContent={activeLesson.content} />
              <QuizSection lessonContent={activeLesson.content} />
            </div>
          ) : null}
        </div>
      </div>

      {/* CHAT - Responsive */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2">
        {isChatOpen ? <X className="w-6 h-6" /> : <><Sparkles className="w-5 h-5" /> <span className="hidden md:inline font-bold">Ask AI</span></>}
      </button>

      <div className={`
        fixed top-0 right-0 h-full w-full md:w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transition-transform duration-500
        ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Chat logic here (Same as before but with better mobile padding) */}
        <div className="flex flex-col h-full">
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-500" /> AI Tutor</h3>
             <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {chatHistory.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                 </div>
               </div>
             ))}
           </div>
           <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask anything..." className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full"><Send className="w-4 h-4" /></button>
           </form>
        </div>
      </div>
    </div>
  )
}
