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
      <div className="flex-1 overflow-y-auto p-6 md:p-16 pt-24 lg:pt-16 scroll-smooth transition-all duration-300">
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

              {/* --- NEW ACTION BAR: Language, Export, Diagram --- */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {/* 1. Multi-Language Dropdown */}
                <select 
                  onChange={async (e) => {
                    const lang = e.target.value;
                    if (!lang) return;
                    const res = await fetch('https://ai-course-platform-i10p.onrender.com/api/translate', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: activeLesson.content, language: lang })
                    });
                    const data = await res.json();
                    setActiveLesson({ ...activeLesson, content: data.translated_text });
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer outline-none"
                >
                  <option value="">🌐 Translate Lesson</option>
                  <option value="Spanish">🇪🇸 Spanish</option>
                  <option value="French">🇫🇷 French</option>
                  <option value="German">🇩🇪 German</option>
                  <option value="Urdu">🇵🇰 Urdu</option>
                  <option value="Arabic">🇦🇪 Arabic</option>
                  <option value="Hindi">🇮🇳 Hindi</option>
                </select>

                {/* 2. Course Export Button */}
                <button 
                  onClick={() => {
                    const blob = new Blob([`# ${activeLesson.title}\n\n${activeLesson.content}`], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${activeLesson.title}.md`; a.click();
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  💾 Export as Markdown
                </button>

                {/* 3. AI Mind Map Button */}
                <button 
                  onClick={async () => {
                    const btn = document.getElementById('mind-map-btn');
                    if (btn) btn.innerText = '🗺️ Generating...'; // Show loading text
                    
                    try {
                      const res = await fetch('https://ai-course-platform-i10p.onrender.com/api/diagram', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ context: activeLesson.content })
                      });
                      const data = await res.json();
                      
                      // Strip existing backticks and enforce a perfect Monospace Markdown block!
                      const cleanDiagram = data.diagram.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '');
                      
                      setActiveLesson({ 
                        ...activeLesson, 
                        content: activeLesson.content + "\n\n### 🗺️ AI Generated Mind Map\n\n```text\n" + cleanDiagram + "\n```\n" 
                      });
                    } catch (e) {
                      alert("Failed to generate mind map.");
                    } finally {
                      if (btn) btn.innerText = '🗺️ Generate Mind Map';
                    }
                  }}
                  id="mind-map-btn"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  🗺️ Generate Mind Map
                </button>
              </div>
              {/* --- END ACTION BAR --- */}

              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">{activeLesson.title}</h1>
              <div className="prose prose-indigo dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
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

      {/* FLOATING CHAT BUTTON */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 z-[60] p-4 rounded-full shadow-2xl transition-all duration-500 transform hover:scale-110 flex items-center justify-center border border-white/20
          ${isChatOpen ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'}`}
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* FLOATING MINI CHAT WINDOW */}
      <div className={`
        fixed bottom-24 right-6 z-50
        w-[350px] md:w-[380px] h-[500px] max-h-[70vh]
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        shadow-2xl
        rounded-3xl overflow-hidden flex flex-col
        transition-all duration-500 ease-out
        ${isChatOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
      `}>

        {/* Compact Header */}
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-2 rounded-xl text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Tutor</h3>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/20">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
              <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ask me anything about this lesson!</p>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                </div>
              </div>
            ))
          )}
          {isChatting && (
            <div className="flex gap-2">
              <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Slim Chat Input */}
        <div className="p-4 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/50 dark:border-slate-800 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-100/50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              disabled={isChatting}
            />
            <button
              type="submit"
              disabled={isChatting || !chatInput.trim()}
              className="absolute right-1.5 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
