// components/CourseViewer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Circle, X, Send, Loader2, Sparkles, Bot, User, ArrowLeft, BookOpen, Volume2, Square, Award } from 'lucide-react'
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
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])
  const [isChatting, setIsChatting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

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

  useEffect(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [activeLesson])

  useEffect(() => {
    if (!activeLesson) return
    const fetchChatHistory = async () => {
      const { data } = await supabase.from('chat_history').select('role, content').eq('lesson_id', activeLesson.id).eq('user_id', userId).order('created_at', { ascending: true })
      if (data) setChatHistory(data)
    }
    fetchChatHistory()
  }, [activeLesson, userId, supabase])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleMarkComplete = async () => {
    if (!activeLesson || completedLessons.has(activeLesson.id)) return
    setLoadingComplete(true)
    try {
      const { error } = await supabase.from('progress').insert({
        user_id: userId, lesson_id: activeLesson.id, is_completed: true, completed_at: new Date().toISOString()
      })
      if (error) throw error
      setCompletedLessons((prev) => new Set(prev).add(activeLesson.id))
    } catch (error: any) {
      alert("Error saving progress: " + error.message)
    } finally {
      setLoadingComplete(false)
    }
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const plainText = activeLesson.content.replace(/[*#`_]/g, '')
      const utterance = new SpeechSynthesisUtterance(plainText)
      utterance.rate = 0.95 
      utterance.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isChatting) return
    const userMsg = { role: 'user', content: chatInput }
    setChatHistory((prev) => [...prev, userMsg])
    setChatInput('')
    setIsChatting(true)
    try {
      await supabase.from('chat_history').insert({ user_id: userId, lesson_id: activeLesson.id, role: 'user', content: userMsg.content })
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatHistory, userMsg], context: activeLesson.content }),
      })
      if (!response.ok) throw new Error("Failed to get AI response")
      const data = await response.json()
      await supabase.from('chat_history').insert({ user_id: userId, lesson_id: activeLesson.id, role: 'assistant', content: data.reply })
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: 'assistant', content: "Sorry, I had trouble connecting." }])
    } finally {
      setIsChatting(false)
    }
  }

  const isCurrentComplete = activeLesson ? completedLessons.has(activeLesson.id) : false

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-slate-950 overflow-hidden relative font-sans transition-colors duration-300">
      
      {/* CERTIFICATE MODAL */}
      {showCertificate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center border-[10px] border-indigo-50 dark:border-slate-800 relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
            <Award className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">Certificate of Completion</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">This certifies that you have successfully completed</p>
            <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-8 border-b-2 border-indigo-100 dark:border-slate-700 pb-4 inline-block">{course.title}</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-10 font-mono">ID: {course.id.split('-')[0].toUpperCase()} • Date: {new Date().toLocaleDateString()}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition">Print / Save PDF</button>
              <button onClick={() => setShowCertificate(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 flex flex-col h-full flex-shrink-0 z-10 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 font-medium w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
          <div className="flex items-start gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-xl mt-1">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{course.title}</h2>
          </div>
          <div className="mt-8">
            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              <span>Course Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          {progressPercentage === 100 && (
            <button onClick={() => setShowCertificate(true)} className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform">
              <Award className="w-5 h-5" /> Claim Certificate!
            </button>
          )}
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {chapters.map((chapter: any) => (
            <div key={chapter.id} className="mb-6">
              <h3 className="font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase text-xs tracking-widest ml-3">{chapter.title}</h3>
              <ul className="space-y-1">
                {chapter.lessons.sort((a: any, b: any) => a.lesson_order - b.lesson_order).map((lesson: any) => {
                  const isActive = activeLesson?.id === lesson.id
                  const isCompleted = completedLessons.has(lesson.id)
                  return (
                    <li key={lesson.id}>
                      <button onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isActive ? 'bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100/50 dark:border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                        }`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" /> : <Circle className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-300 dark:text-indigo-600' : 'text-slate-300 dark:text-slate-600'}`} />}
                        <span className="line-clamp-2 leading-relaxed">{lesson.lesson_order}. {lesson.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 overflow-y-auto p-8 md:p-16 scroll-smooth transition-all duration-500 ${isChatOpen ? 'mr-[400px]' : 'mr-0'}`}>
        <div className="max-w-3xl mx-auto pb-20">
          {activeLesson ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <div className="flex items-center justify-between mb-4">
                <div className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold tracking-wider uppercase border border-indigo-100 dark:border-indigo-500/20">
                  Lesson {activeLesson.lesson_order}
                </div>
                <button onClick={toggleSpeech} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${isSpeaking ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                  {isSpeaking ? <><Square className="w-4 h-4 fill-current" /> Stop Audio</> : <><Volume2 className="w-4 h-4" /> Listen to Lesson</>}
                </button>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-10 tracking-tight leading-tight">{activeLesson.title}</h1>
              
              {/* MARKDOWN PROSE STYLING FOR DARK MODE */}
              <div className="prose prose-indigo dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-strong:text-slate-900 dark:prose-strong:text-white">
                <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
              </div>
              
              <div className="mt-16 pt-10 border-t border-slate-200/60 dark:border-slate-800">
                {isCurrentComplete ? (
                  <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/20 px-6 py-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-800 w-fit">
                    <div className="bg-emerald-100 dark:bg-emerald-800/50 p-1 rounded-full"><CheckCircle className="w-5 h-5" /></div>
                    Lesson Completed! Stellar work.
                  </div>
                ) : (
                  <button onClick={handleMarkComplete} disabled={loadingComplete} className="group flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-indigo-600 transition-all duration-300 shadow-lg disabled:opacity-70">
                    {loadingComplete ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><CheckCircle className="w-5 h-5 text-slate-400 dark:text-indigo-200 group-hover:text-white transition-colors" /> Mark Lesson as Complete</>}
                  </button>
                )}
              </div>
              
              <div className="mt-12 flex flex-col md:flex-row gap-4">
                <FlashcardSection lessonContent={activeLesson.content} />
              </div>
              <QuizSection lessonContent={activeLesson.content} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">Select a lesson to begin.</div>
          )}
        </div>
      </div>

      {/* FLOATING CHAT */}
      {!isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 border border-white/20">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="font-semibold pr-2">Ask AI Tutor</span>
        </button>
      )}

      {/* CHAT PANEL */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-500 flex flex-col z-50 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} sm:rounded-l-[2.5rem] overflow-hidden`}>
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-2.5 rounded-2xl text-white"><Bot className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">AI Companion</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-in fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] p-4 rounded-2xl text-[15px] shadow-sm ${msg.role === 'user' ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
                <div className={msg.role === 'user' ? '' : 'prose prose-sm dark:prose-invert prose-slate'}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center"><Bot className="w-4 h-4" /></div><div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex gap-3"><Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" /></div></div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/50 dark:border-slate-800 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message AI Tutor..." className="w-full pl-5 pr-14 py-4 bg-slate-100/50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-white rounded-full text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" disabled={isChatting} />
            <button type="submit" disabled={isChatting || !chatInput.trim()} className="absolute right-2 bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      </div>
    </div>
  )
}
