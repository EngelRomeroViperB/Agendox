'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface MiniCalendarProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  appointmentCounts?: Record<string, number> // "yyyy-MM-dd" → count
  className?: string
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  appointmentCounts = {},
  className = '',
}: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate))

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows: Date[][] = []
    let day = calStart
    while (day <= calEnd) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      rows.push(week)
    }
    return rows
  }, [viewMonth])

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className={`select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {weeks.flat().map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd')
          const count = appointmentCounts[key] || 0
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, viewMonth)
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center justify-center h-10 text-sm rounded-lg transition-colors
                ${isCurrentMonth ? '' : 'opacity-30'}
                ${isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isToday
                    ? 'bg-accent font-semibold'
                    : 'hover:bg-muted'
                }
              `}
            >
              {day.getDate()}
              {count > 0 && !isSelected && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              {count > 0 && isSelected && (
                <span className="absolute bottom-0.5 text-[9px] leading-none font-normal opacity-80">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
