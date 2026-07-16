// components/FileUpload.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UploadCloud, Loader2, Sparkles, FileText } from 'lucide-react'

export default function FileUpload({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleUpload = async () => {
    if (!file) return
    // Validate file type (must be PDF)
    if (
      file.type !== 'application/pdf' ||
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      window.alert('Please upload PDF files only.')
      return
    }
    setLoading(true)
    
    try {
      // 1. Generate the Course via AI
      setStatus('Extracting text and asking AI to generate course... (10-20s)')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('https://ai-course-platform-i10p.onrender.com/api/generate-course', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Server Error')
      }
      const { data: courseData } = await response.json()
      
      // 2. DUPLICATE CHECK! Check if user already has a course with this title
      const { data: existingCourses } = await supabase
        .from('courses')
        .select('title')
        .eq('user_id', userId)
        .ilike('title', courseData.course_title) // Case-insensitive match

      if (existingCourses && existingCourses.length > 0) {
        // Show browser popup!
        const wantsToSaveDuplicate = window.confirm(
          `⚠️ Duplicate Detected!\n\nYou already have a course named "${courseData.course_title}".\n\nDo you want to save this duplicate anyway?`
        )
        
        if (!wantsToSaveDuplicate) {
          setStatus('Upload cancelled.')
          setLoading(false)
          setFile(null)
          return // Stop the process here!
        }
      }

      // 3. Save to Database
      setStatus('Course generated! Saving to database...')

      const { data: newCourse, error: courseError } = await supabase.from('courses').insert({
        user_id: userId, title: courseData.course_title, description: courseData.description, estimated_time: courseData.estimated_time, difficulty_level: courseData.difficulty_level,
      }).select().single()
      if (courseError) throw courseError

      for (let i = 0; i < courseData.chapters.length; i++) {
        const chapter = courseData.chapters[i]
        const { data: newChapter, error: chapterError } = await supabase.from('chapters').insert({
          course_id: newCourse.id, title: chapter.chapter_title, chapter_order: i + 1,
        }).select().single()
        if (chapterError) throw chapterError

        const lessonsToInsert = chapter.lessons.map((lesson: any, index: number) => ({
          chapter_id: newChapter.id, title: lesson.lesson_title, content: lesson.content, lesson_order: index + 1,
        }))
        const { error: lessonError } = await supabase.from('lessons').insert(lessonsToInsert)
        if (lessonError) throw lessonError
      }

      setStatus('Done! Redirecting...')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      if (status !== 'Upload cancelled.') {
        setLoading(false)
        setFile(null)
        setStatus('')
      }
    }
  }

  return (
    <div className="relative overflow-hidden mt-8 p-8 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-800 transition-all duration-300">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Generate New Course
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Upload any PDF document, book, or research paper and let our AI transform it into a structured, interactive e-course instantly.</p>
        </div>
        
        <div className="w-full md:w-[400px]">
          <div className={`group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all duration-300 relative cursor-pointer
            ${file ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 dark:border-indigo-400' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'}`}>
            <input 
            type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" disabled={loading}
          />
            
            {file ? (
              <div className="flex flex-col items-center text-center">
                <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-3" />
                <p className="text-indigo-900 dark:text-indigo-100 font-semibold truncate max-w-[200px]">{file.name}</p>
                <p className="text-indigo-600/70 dark:text-indigo-400/70 text-sm mt-1">Ready to transform</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center group-hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center mb-4 border border-transparent dark:border-slate-700">
                  <UploadCloud className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">Drag & drop your PDF here</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Maximum file size 50MB</p>
              </div>
            )}
          </div>

          {loading ? (
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-pulse">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{status}</span>
            </div>
          </div>
        ) : file ? (
          <button onClick={handleUpload} disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all duration-300 disabled:opacity-70 shadow-lg">
            ✨ Generate Course Now
          </button>
        ) : null}
        </div>
      </div>
    </div>
  )
}
