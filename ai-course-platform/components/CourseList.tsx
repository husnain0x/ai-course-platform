// components/CourseList.tsx
'use client'

import { useState } from 'react'
import { Search, Clock, BarChart, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CourseList({ initialCourses }: { initialCourses: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCourses = initialCourses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="mt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Your Library</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Resume learning your generated courses.</p>
        </div>
        
        <div className="relative max-w-sm w-full group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
              <Link href={`/course/${course.id}`} key={course.id} className="relative z-10 group flex flex-col h-full bg-white/80 dark:bg-slate-900 backdrop-blur-sm rounded-3xl border border-slate-200/60 dark:border-slate-800 overflow-hidden hover:shadow-[0_8px_30px_rgb(6,81,237,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">>
              
              {/* ✨ NEW: A beautiful colorful header for each card */}
              <div className="h-32 bg-gradient-to-br from-blue-500/10 to-violet-500/10 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-blue-500/20 dark:text-slate-700 absolute -right-2 -bottom-2 scale-150 transform -rotate-12 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700">
                  {course.difficulty_level}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col bg-white dark:bg-transparent">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{course.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    {course.estimated_time}
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition-transform duration-300">
                    Start Learning <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 border-dashed rounded-3xl">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No courses found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center max-w-sm">
            {initialCourses.length === 0 ? "You haven't generated any courses yet. Upload a PDF above to get started!" : "We couldn't find any courses matching your search."}
          </p>
        </div>
      )}
    </div>
  )
}
