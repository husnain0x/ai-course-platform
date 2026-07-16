// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import CourseList from '@/components/CourseList'
import { LogOut, BookOpen } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import SessionTimeout from '@/components/SessionTimeout'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: courses } = await supabase.from('courses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 font-sans transition-colors duration-300">
      <SessionTimeout />
      
      {/* ✨ NEW: Ultra-clean frosted glass navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/60 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-1.5 rounded-lg shadow-sm shadow-blue-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">E-Course AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
              {user.email}
            </span>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-4">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
            Welcome back!
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">Ready to learn something new today?</p>
        </header>
        
        <FileUpload userId={user.id} />
        <CourseList initialCourses={courses || []} />

        {/* Professional Footer */}
        <footer className="mt-20 pt-10 border-t border-slate-200/50 dark:border-slate-800 text-center pb-8">
          <div className="flex justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-6">
            <a href="https://github.com/husnain0x" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Email</a>
          </div>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 opacity-80">
            © {new Date().getFullYear()} Husnain Ajmal - Robotics & AI Engineer - Built & deployed on Vercel
          </p>
        </footer>
      </main>
    </div>
  )
}