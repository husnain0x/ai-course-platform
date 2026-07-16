// components/SessionTimeout.tsx
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export default function SessionTimeout() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const logout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }

    // Start the 1-hour countdown
    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, SESSION_DURATION)
    }

    // Reset the timer on user activity (optional: extends session on interaction)
    const resetTimer = () => startTimer()

    startTimer()

    // Reset timer on any user interaction so idle users get logged out
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('scroll', resetTimer)
    }
  }, [router])

  return null // This component renders nothing — it just runs the timer
}
