'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock, Phone, CalendarDays } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { MiniCalendar } from '@/components/ui/mini-calendar'

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  client_name: string
  client_phone: string
  client_email: string
  confirmation_code: string
  notes: string | null
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

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterByDate, setFilterByDate] = useState(false)

  const fetchAppointments = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    // Always fetch the full month for calendar dots
    const from = startOfMonth(selectedDate).toISOString()
    const to = endOfMonth(selectedDate).toISOString()
    params.set('from', from)
    params.set('to', to)

    fetch(`/api/admin/appointments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data.appointments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, selectedDate])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const appointmentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    appointments.forEach(a => {
      const key = format(new Date(a.scheduled_at), 'yyyy-MM-dd')
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [appointments])

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    const res = await fetch('/api/admin/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: appointmentId, status: newStatus }),
    })
    if (res.ok) {
      toast.success(`Cita marcada como ${STATUS_LABELS[newStatus]?.toLowerCase() || newStatus}`)
      fetchAppointments()
    } else {
      toast.error('Error al actualizar el estado')
    }
  }

  const filtered = appointments.filter((apt) => {
    // Date filter
    if (filterByDate && !isSameDay(new Date(apt.scheduled_at), selectedDate)) return false
    // Search filter
    if (!search) return true
    const q = search.toLowerCase()
    return (
      apt.client_name.toLowerCase().includes(q) ||
      apt.client_phone.includes(q) ||
      apt.client_email.toLowerCase().includes(q) ||
      apt.confirmation_code.toLowerCase().includes(q)
    )
  }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Citas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={(date) => { setSelectedDate(date); setFilterByDate(true) }}
              appointmentCounts={appointmentCounts}
            />
            <div className="mt-3 space-y-2">
              <Button
                variant={filterByDate ? 'default' : 'outline'}
                size="sm"
                className="w-full text-xs"
                onClick={() => setFilterByDate(!filterByDate)}
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                {filterByDate ? `Filtrando: ${format(selectedDate, 'd MMM', { locale: es })}` : 'Mostrando todo el mes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments list */}
        <div className="lg:col-span-3 space-y-4">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar cliente, teléfono o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} cita{filtered.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No se encontraron citas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{format(new Date(apt.scheduled_at), "d MMM yyyy", { locale: es })}</p>
                        <p className="text-muted-foreground">{format(new Date(apt.scheduled_at), 'HH:mm')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{apt.client_name}</p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />{apt.client_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{apt.services?.name || '—'}</p>
                        <p className="text-muted-foreground">{apt.services?.duration_minutes} min · ${Number(apt.services?.price || 0).toLocaleString('es-CO')}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{apt.staff?.name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{apt.confirmation_code}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[apt.status] || 'outline'}>
                        {STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {apt.status === 'pending' && (
                          <Button
                            variant="ghost" size="icon" title="Confirmar"
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <>
                            <Button
                              variant="ghost" size="icon" title="Completar"
                              onClick={() => updateStatus(apt.id, 'completed')}
                            >
                              <Clock className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" title="Cancelar"
                              onClick={() => updateStatus(apt.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
