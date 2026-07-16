// app/course/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseViewer from '@/components/CourseViewer'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Get the course ID from the URL
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch the Course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  // 3. Fetch Chapters and attach their Lessons
  const { data: chapters } = await supabase
    .from('chapters')
    .select(`
      *,
      lessons (*)
    `)
    .eq('course_id', id)
    .order('chapter_order', { ascending: true })

  if (!course || !chapters) {
    return <div className="p-8 text-center text-red-500">Course not found!</div>
  }

  // 4. Pass the data to our interactive UI
  return <CourseViewer course={course} chapters={chapters} userId={user.id} />
}
