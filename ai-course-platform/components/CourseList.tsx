// components/CourseList.tsx
'use client'

import { useState } from 'react'
import { Search, Clock, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CourseList({ initialCourses }: { initialCourses: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCourses = (initialCourses || []).filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mt-8 md:mt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Library</h2>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Link 
            href={`/course/${course.id}`} 
            key={course.id} 
            className="relative z-10 group block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden active:scale-95 transition-all duration-200 shadow-sm"
          >
            <div className="h-24 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
               <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{course.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2">{course.description}</p>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3"/> {course.estimated_time}
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
