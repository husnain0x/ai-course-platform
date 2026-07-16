// app/login/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, BookOpen, Eye, EyeOff, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation: Terms must be accepted for sign up
    if (mode === 'signup' && !agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError

        // Save email to localStorage if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        router.push('/dashboard')
        router.refresh()
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) throw authError
        setSuccess('Account created! Check your email for a confirmation link.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [email, password, mode, rememberMe, agreedToTerms, router, supabase.auth])

  // Load remembered email on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rememberedEmail')
      if (saved) {
        setEmail(saved)
        setRememberMe(true)
      }
    }
  })

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 40 : -40, opacity: 0 }),
  }

  const toggleMode = () => {
    setError(null)
    setSuccess(null)
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FAFAFA] dark:bg-slate-950 relative font-sans transition-colors duration-500">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-fuchsia-400/15 dark:bg-fuchsia-600/10 rounded-full blur-[100px] animate-pulse-slow animation-delay-4000" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px] mx-4 p-8 sm:p-10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 tracking-tighter drop-shadow-sm">
            E-Course AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
            {mode === 'signin' ? 'Welcome back! Ready to learn?' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Error / Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait" custom={mode === 'signin' ? 1 : -1}>
            <motion.div
              key={mode}
              custom={mode === 'signin' ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-4"
            >
              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="email-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-sm"
                />
              </div>

              {/* Password with show/hide toggle */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Remember Me (Sign In) / Terms Agreement (Sign Up) */}
          <div className="space-y-3 pt-1">
            {mode === 'signin' ? (
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/50 bg-white dark:bg-slate-800 cursor-pointer accent-indigo-600"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Remember me
                </span>
              </label>
            ) : (
              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/50 bg-white dark:bg-slate-800 cursor-pointer accent-indigo-600"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  I agree to the{' '}
                  <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                    Privacy Policy
                  </button>
                </span>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !agreedToTerms)}
            className="w-full group relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Protected by Supabase Auth · 256-bit SSL
          </span>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/60 dark:border-slate-700/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white/70 dark:bg-slate-900/60 px-3 text-slate-400 dark:text-slate-500 font-medium">
              {mode === 'signin' ? 'New here?' : 'Already a member?'}
            </span>
          </div>
        </div>

        {/* Toggle Mode */}
        <button
          onClick={toggleMode}
          className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          {mode === 'signin' ? 'Create a free account' : 'Sign in to your account'}
        </button>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[11px] font-medium text-slate-400 dark:text-slate-600 space-y-1.5">
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          Crafted with <span className="text-red-500">❤️</span> by <span className="font-bold text-slate-700 dark:text-slate-300">Husnain Ajmal</span>
        </p>
        <p>© {new Date().getFullYear()} E-Course AI Platform. All rights reserved.</p>
        <p className="space-x-3">
          <button className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Terms</button>
          <span>·</span>
          <button className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Privacy</button>
          <span>·</span>
          <button className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Support</button>
        </p>
      </div>
    </div>
  )
}
