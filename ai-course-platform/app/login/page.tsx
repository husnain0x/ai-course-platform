// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, BookOpen, CheckSquare, Square } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [rememberMe, setRememberMe] = useState(true) // Default to true
  const [loading, setLoading] = useState(true) // Start loading to check session instantly
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // --- SAFE AUTO-LOGIN CHECK ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Valid session! Redirect instantly!
        router.push('/dashboard')
      } else {
        setLoading(false) // No session, show the login form safely
      }
    }
    
    checkSession()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'signup' && !agreed) {
      setError("You must agree to the Terms of Service to create an account.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: authError } = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

      if (authError) throw authError
      
      // Save their "Remember Me" preference
      if (mode === 'signin') {
        localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false')
      } else {
        localStorage.setItem('rememberMe', 'true') 
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  }

  const toggleMode = () => {
    setError(null)
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center overflow-hidden bg-[#FAFAFA] dark:bg-slate-950 relative font-sans transition-colors duration-500">
      
      {/* Absolute Theme Toggle */}
      <div className="absolute top-6 right-6 z-50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 shadow-sm p-1">
        <ThemeToggle />
      </div>

      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Branding (Visible only on small screens) */}
      <div className="lg:hidden relative z-20 text-center mb-6 px-6 mt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-4 border border-indigo-100 dark:border-indigo-800 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          HA the Legacy
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
          Let's build <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-500 italic font-serif">something worth shipping.</span>
        </h2>
      </div>

      {/* Hero Branding Section (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-center absolute left-0 top-0 bottom-0 w-1/2 px-16 xl:px-24 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6 border border-indigo-100 dark:border-indigo-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            HA the Legacy
          </div>
          <h2 className="text-5xl xl:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
            Let's build <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-500 italic font-serif pr-2">something worth shipping.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mb-8">
            Open to robotics, embedded, and software collaborations.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 font-semibold text-sm">
            <a href="mailto:Husnain.ajmal999@gmail.com" className="px-8 py-3.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
              Email Me &rarr;
            </a>
            <a href="https://github.com/husnain0x" target="_blank" rel="noreferrer" className="px-8 py-3.5 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              GitHub ↗
            </a>
            <a href="https://www.linkedin.com/in/husnain-ajmal" target="_blank" rel="noreferrer" className="px-8 py-3.5 rounded-full bg-[#0A66C2] text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              LinkedIn ↗
            </a>
          </div>
        </div>
      </div>

      {/* Glassmorphic Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] mx-4 lg:ml-auto lg:mr-[10%] p-8 sm:p-12 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2.5rem] max-h-[85vh] overflow-y-auto"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 tracking-tighter mb-2">
            E-Course AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {mode === 'signin' ? 'Welcome back! Ready to learn?' : 'Create an account to get started.'}
          </p>
        </div>

        <AnimatePresence mode='wait'>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-5">
          <AnimatePresence mode="wait" custom={mode === 'signin' ? 1 : -1}>
            <motion.div key={mode} custom={mode === 'signin' ? 1 : -1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }} className="space-y-4">
              
              {/* BROWSER AUTOFILL ADDED (name & autoComplete) */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="email" 
                  name="email" 
                  autoComplete="email" 
                  placeholder="Email address" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="password" 
                  name="password" 
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                />
              </div>

              {/* DYNAMIC CHECKBOXES */}
              <div className="pt-2 flex items-center">
                {mode === 'signup' ? (
                  <button type="button" onClick={() => setAgreed(!agreed)} className="flex items-start gap-2 text-left focus:outline-none group">
                    {agreed ? <CheckSquare className="w-5 h-5 text-indigo-600 mt-0.5" /> : <Square className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 mt-0.5 transition-colors" />}
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      I agree to the <span className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</span>.
                    </span>
                  </button>
                ) : (
                  <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 focus:outline-none group">
                    {rememberMe ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Keep me logged in</span>
                  </button>
                )}
              </div>

            </motion.div>
          </AnimatePresence>

          <button type="submit" disabled={loading} className="w-full relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg disabled:opacity-70 mt-2">
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" /></>)}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
          <p>
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={toggleMode} className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition-colors focus:outline-none">
              {mode === 'signin' ? 'Sign Up Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
      
      {/* FOOTER */}
      <div className="absolute bottom-4 lg:bottom-6 left-0 right-0 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 space-y-3 lg:space-y-4 z-20 pb-4 lg:pb-0">
        <div className="flex flex-wrap justify-center gap-4 lg:gap-6 text-[9px] lg:text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 px-4">
          <a href="https://github.com/husnain0x" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white hover:-translate-y-0.5 transition-transform">GitHub</a>
          <a href="https://www.linkedin.com/in/husnain-ajmal" target="_blank" rel="noreferrer" className="hover:text-[#0A66C2] dark:hover:text-blue-400 hover:-translate-y-0.5 transition-transform">LinkedIn</a>
          <a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 hover:-translate-y-0.5 transition-transform">Instagram</a>
          <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:-translate-y-0.5 transition-transform">Discord</a>
          <a href="mailto:Husnain.ajmal999@gmail.com" className="hover:text-yellow-600 dark:hover:text-yellow-400 hover:-translate-y-0.5 transition-transform">Email</a>
        </div>
        <p className="opacity-60 px-4">
          © {new Date().getFullYear()} Husnain Ajmal - Robotics & AI Engineer - Built & deployed on Vercel
        </p>
      </div>
    </div>
  )
}
