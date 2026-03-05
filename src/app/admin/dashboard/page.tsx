'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Clock, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { MiniCalendar } from '@/components/ui/mini-calendar'

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  client_name: string
  client_phone: string
  staff: { name: string } | null
  services: { name: string; duration_minutes: number; price: number } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  cancelled: 'destructive',
  completed: 'secondary',
}

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [monthAppts, setMonthAppts] = useState<Appointment[]>([])
  const [weekAppts, setWeekAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const monthStart = startOfMonth(selectedDate).toISOString()
    const monthEnd = endOfMonth(selectedDate).toISOString()

    Promise.all([
      fetch(`/api/admin/appointments?from=${monthStart}&to=${monthEnd}`).then(r => r.json()),
      fetch(`/api/admin/appointments?from=${weekStart}&to=${weekEnd}`).then(r => r.json()),
    ])
      .then(([monthData, weekData]) => {
        setMonthAppts(monthData.appointments || [])
        setWeekAppts(weekData.appointments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedDate])

  useEffect(() => { fetchData() }, [fetchData])

  // Compute metrics
  const todayAppts = monthAppts.filter(a => isSameDay(new Date(a.scheduled_at), new Date()))
  const todayPending = todayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed')
  const weekTotal = weekAppts.length
  const weekCompleted = weekAppts.filter(a => a.status === 'completed').length
  const weekRevenue = weekAppts
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (Number(a.services?.price) || 0), 0)

  // Appointments for the selected date
  const selectedDayAppts = monthAppts
    .filter(a => isSameDay(new Date(a.scheduled_at), selectedDate))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  // Appointment counts per day for calendar dots
  const appointmentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    monthAppts.forEach(a => {
      const key = format(new Date(a.scheduled_at), 'yyyy-MM-dd')
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [monthAppts])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Citas Hoy</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayPending.length}</p>
            <p className="text-xs text-muted-foreground">pendientes/confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{weekTotal}</p>
            <p className="text-xs text-muted-foreground">citas esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{weekCompleted}</p>
            <p className="text-xs text-muted-foreground">esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${weekRevenue.toLocaleString('es-CO')}</p>
            <p className="text-xs text-muted-foreground">completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario + Citas del día */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              appointmentCounts={appointmentCounts}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Citas — {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </CardTitle>
            <Link href="/admin/appointments">
              <Button variant="ghost" size="sm">
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : selectedDayAppts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No hay citas para este día
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayAppts.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <span className="font-mono text-sm font-bold block">
                          {format(new Date(apt.scheduled_at), 'HH:mm')}
                        </span>
                        {apt.services && (
                          <span className="text-[10px] text-muted-foreground">
                            {apt.services.duration_minutes}min
                          </span>
                        )}
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <p className="font-medium text-sm">{apt.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.services?.name}{apt.staff ? ` · ${apt.staff.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[apt.status] || 'outline'}>
                      {STATUS_LABELS[apt.status] || apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
