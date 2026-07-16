// components/SessionTimeout.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const THROTTLE_MS = 30_000 // Only reset timer every 30 seconds max (performance)

export default function SessionTimeout() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastResetRef = useRef<number>(Date.now())

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  useEffect(() => {
    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, SESSION_DURATION)
      lastResetRef.current = Date.now()
    }

    // Throttled reset — avoids hundreds of timer resets per second
    const resetTimer = () => {
      if (Date.now() - lastResetRef.current > THROTTLE_MS) {
        startTimer()
      }
    }

    startTimer()

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [logout])

  return null
}
