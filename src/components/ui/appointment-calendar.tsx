'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  format,
  setHours,
  setMinutes,
  getHours,
} from 'date-fns'
import { es } from 'date-fns/locale'

export interface CalendarAppointment {
  id: string
  scheduled_at: string
  status: string
  client_name: string
  client_phone?: string
  client_email?: string
  confirmation_code?: string
  staff?: { name: string } | null
  services?: { name: string; duration_minutes: number; price: number } | null
  staff_id?: string
}

interface AppointmentCalendarProps {
  appointments: CalendarAppointment[]
  staffList?: { id: string; name: string }[]
  onCreateAppointment?: (date: Date) => void
  onClickAppointment?: (appointment: CalendarAppointment) => void
  className?: string
}

type ViewMode = 'day' | 'week' | 'month'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  confirmed: 'bg-green-100 border-green-400 text-green-800',
  completed: 'bg-gray-100 border-gray-400 text-gray-600',
  cancelled: 'bg-red-100 border-red-300 text-red-700 line-through opacity-60',
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6:00 - 22:00

export function AppointmentCalendar({
  appointments,
  staffList = [],
  onCreateAppointment,
  onClickAppointment,
  className = '',
}: AppointmentCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [selectedAppt, setSelectedAppt] = useState<CalendarAppointment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredAppts = useMemo(() => {
    if (staffFilter === 'all') return appointments
    return appointments.filter(a => a.staff_id === staffFilter)
  }, [appointments, staffFilter])

  const navigate = (dir: number) => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, dir))
    else if (viewMode === 'week') setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
  }

  const goToday = () => setCurrentDate(new Date())

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') return format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(ws, 'd MMM', { locale: es })} — ${format(we, 'd MMM yyyy', { locale: es })}`
    }
    return format(currentDate, 'MMMM yyyy', { locale: es })
  }, [currentDate, viewMode])

  const handleApptClick = (appt: CalendarAppointment) => {
    if (onClickAppointment) {
      onClickAppointment(appt)
    } else {
      setSelectedAppt(appt)
      setDetailOpen(true)
    }
  }

  const handleSlotClick = (date: Date) => {
    if (onCreateAppointment) onCreateAppointment(date)
  }

  // DAY VIEW
  const renderDayView = () => {
    const dayAppts = filteredAppts.filter(a => isSameDay(new Date(a.scheduled_at), currentDate))
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[60px_1fr]">
          {HOURS.map(hour => {
            const hourAppts = dayAppts.filter(a => getHours(new Date(a.scheduled_at)) === hour)
            return (
              <div key={hour} className="contents">
                <div className="text-xs text-muted-foreground text-right pr-2 py-3 border-b bg-muted/30">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div
                  className="border-b border-l min-h-[52px] p-1 hover:bg-muted/20 cursor-pointer relative"
                  onClick={() => handleSlotClick(setMinutes(setHours(currentDate, hour), 0))}
                >
                  {hourAppts.map(appt => (
                    <button
                      key={appt.id}
                      className={`block w-full text-left text-xs rounded px-2 py-1 mb-0.5 border-l-2 truncate ${STATUS_COLORS[appt.status] || 'bg-muted'}`}
                      onClick={(e) => { e.stopPropagation(); handleApptClick(appt) }}
                    >
                      <span className="font-medium">{format(new Date(appt.scheduled_at), 'HH:mm')}</span>
                      {' '}{appt.client_name} — {appt.services?.name || ''}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // WEEK VIEW
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="border rounded-lg overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-background border-b">
          <div className="border-r" />
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={`text-center py-2 border-r text-xs font-medium ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''}`}
            >
              <div className="text-muted-foreground capitalize">{format(day, 'EEE', { locale: es })}</div>
              <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        {/* Time grid */}
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)]">
            <div className="text-xs text-muted-foreground text-right pr-2 py-2 border-b border-r bg-muted/30">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map(day => {
              const cellAppts = filteredAppts.filter(a => {
                const d = new Date(a.scheduled_at)
                return isSameDay(d, day) && getHours(d) === hour
              })
              return (
                <div
                  key={day.toISOString() + hour}
                  className="border-b border-r min-h-[44px] p-0.5 hover:bg-muted/20 cursor-pointer"
                  onClick={() => handleSlotClick(setMinutes(setHours(day, hour), 0))}
                >
                  {cellAppts.map(appt => (
                    <button
                      key={appt.id}
                      className={`block w-full text-left text-[10px] leading-tight rounded px-1 py-0.5 mb-0.5 border-l-2 truncate ${STATUS_COLORS[appt.status] || 'bg-muted'}`}
                      onClick={(e) => { e.stopPropagation(); handleApptClick(appt) }}
                      title={`${appt.client_name} — ${appt.services?.name || ''}`}
                    >
                      <span className="font-semibold">{format(new Date(appt.scheduled_at), 'HH:mm')}</span>
                      {' '}{appt.client_name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // MONTH VIEW
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const weeks: Date[][] = []
    let day = calStart
    while (day <= calEnd) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      weeks.push(week)
    }

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 bg-muted/30 border-b">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map(day => {
              const dayAppts = filteredAppts.filter(a => isSameDay(new Date(a.scheduled_at), day))
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={day.toISOString()}
                  className={`border-b border-r min-h-[80px] p-1 cursor-pointer hover:bg-muted/20 ${isCurrentMonth ? '' : 'opacity-40 bg-muted/10'}`}
                  onClick={() => { setCurrentDate(day); setViewMode('day') }}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 3).map(appt => (
                      <button
                        key={appt.id}
                        className={`block w-full text-left text-[10px] leading-tight rounded px-1 py-0.5 truncate ${STATUS_COLORS[appt.status] || 'bg-muted'}`}
                        onClick={(e) => { e.stopPropagation(); handleApptClick(appt) }}
                      >
                        {format(new Date(appt.scheduled_at), 'HH:mm')} {appt.client_name.split(' ')[0]}
                      </button>
                    ))}
                    {dayAppts.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center">+{dayAppts.length - 3} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold capitalize ml-1">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {staffList.length > 0 && (
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {staffList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex border rounded-lg p-0.5">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setViewMode(mode)}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {[
          { status: 'pending', label: 'Pendiente' },
          { status: 'confirmed', label: 'Confirmada' },
          { status: 'completed', label: 'Completada' },
          { status: 'cancelled', label: 'Cancelada' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar body */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de cita</DialogTitle>
          </DialogHeader>
          {selectedAppt && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">{selectedAppt.client_name}</span>
                <Badge variant={selectedAppt.status === 'cancelled' ? 'destructive' : selectedAppt.status === 'completed' ? 'secondary' : 'default'}>
                  {selectedAppt.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Servicio</span>
                  <span className="font-medium">{selectedAppt.services?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Profesional</span>
                  <span className="font-medium">{selectedAppt.staff?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Fecha y hora</span>
                  <span className="font-medium">
                    {format(new Date(selectedAppt.scheduled_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Duración</span>
                  <span className="font-medium">{selectedAppt.services?.duration_minutes || '—'} min</span>
                </div>
                {selectedAppt.client_email && (
                  <div>
                    <span className="text-muted-foreground block text-xs">Email</span>
                    <span className="font-medium">{selectedAppt.client_email}</span>
                  </div>
                )}
                {selectedAppt.client_phone && (
                  <div>
                    <span className="text-muted-foreground block text-xs">Teléfono</span>
                    <span className="font-medium">{selectedAppt.client_phone}</span>
                  </div>
                )}
                {selectedAppt.services?.price != null && (
                  <div>
                    <span className="text-muted-foreground block text-xs">Precio</span>
                    <span className="font-medium">${Number(selectedAppt.services.price).toLocaleString('es-CO')}</span>
                  </div>
                )}
                {selectedAppt.confirmation_code && (
                  <div>
                    <span className="text-muted-foreground block text-xs">Código</span>
                    <span className="font-mono font-medium">{selectedAppt.confirmation_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
