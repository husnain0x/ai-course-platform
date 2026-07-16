// app/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Check if the user is actually logged in
  const { data: { user } } = await supabase.auth.getUser()

  // 2. If they are logged in, sign them out (this clears the cookies)
  if (user) {
    await supabase.auth.signOut()
  }

  // 3. Redirect them back to the login page securely
  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/login', url.origin), {
    status: 302,
  })
}
