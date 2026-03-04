'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Clock, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

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
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [weekAppts, setWeekAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const todayStart = startOfDay(now).toISOString()
    const todayEnd = endOfDay(now).toISOString()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

    Promise.all([
      fetch(`/api/admin/appointments?from=${todayStart}&to=${todayEnd}`).then(r => r.json()),
      fetch(`/api/admin/appointments?from=${weekStart}&to=${weekEnd}`).then(r => r.json()),
    ])
      .then(([todayData, weekData]) => {
        setTodayAppts(todayData.appointments || [])
        setWeekAppts(weekData.appointments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const todayPending = todayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed')
  const weekTotal = weekAppts.length
  const weekCompleted = weekAppts.filter(a => a.status === 'completed').length
  const weekRevenue = weekAppts
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (Number(a.services?.price) || 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Citas de hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Citas de Hoy — {format(new Date(), "d 'de' MMMM", { locale: es })}
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
          ) : todayAppts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No hay citas programadas para hoy
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-bold">
                      {format(new Date(apt.scheduled_at), 'HH:mm')}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{apt.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.services?.name} · {apt.staff?.name}
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
  )
}
