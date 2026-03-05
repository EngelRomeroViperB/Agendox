'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, XCircle, ArrowLeft, Loader2, Clock, User, Calendar, AlertTriangle, Mail, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentData {
  id: string
  confirmation_code: string
  scheduled_at: string
  status: string
  client_name: string
  client_email: string
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

export default function MyAppointment() {
  const { business } = useBusiness()
  const [searchMode, setSearchMode] = useState<'code' | 'email'>('code')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (searchMode === 'code' && !code.trim()) {
      toast.error('Ingresa un código de reserva'); return
    }
    if (searchMode === 'email' && !email.trim()) {
      toast.error('Ingresa tu email'); return
    }

    setLoading(true)
    setSearched(true)
    setAppointment(null)
    setAppointments([])

    try {
      const param = searchMode === 'code'
        ? `code=${code.trim()}`
        : `email=${encodeURIComponent(email.trim())}`
      const res = await fetch(`/api/appointments/lookup?${param}&business_id=${business.id}`)
      const data = await res.json()

      if (res.ok && !data.error) {
        if (data.appointments) {
          setAppointments(data.appointments)
          if (data.appointments.length === 1) setAppointment(data.appointments[0])
        } else {
          setAppointment(data)
        }
      } else {
        toast.error(searchMode === 'code' ? 'No se encontró una cita con ese código' : 'No se encontraron citas con ese email')
      }
    } catch {
      toast.error('Error al buscar')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return
    setCancelling(true)

    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation_code: appointment.confirmation_code,
          business_id: business.id,
        }),
      })

      if (res.ok) {
        toast.success('Cita cancelada exitosamente')
        setAppointment({ ...appointment, status: 'cancelled' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Error al cancelar la cita')
      }
    } catch {
      toast.error('Error al cancelar la cita')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-4" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
        <div className="max-w-xl mx-auto">
          <Link href={`/${business.slug}`} className="text-sm opacity-80 hover:opacity-100 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Volver al portal
          </Link>
          <h1 className="text-2xl font-bold mt-2">{business.name}</h1>
          <p className="text-sm opacity-80">Consultar mi cita</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Buscador */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-3">Buscar mi cita</h2>
            <div className="flex gap-1 mb-4">
              <Button
                variant={searchMode === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSearchMode('code'); setSearched(false); setAppointment(null); setAppointments([]) }}
                className="flex-1"
              >
                <Hash className="h-3.5 w-3.5 mr-1.5" /> Código
              </Button>
              <Button
                variant={searchMode === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSearchMode('email'); setSearched(false); setAppointment(null); setAppointments([]) }}
                className="flex-1"
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                {searchMode === 'code' ? (
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ej: ABC12345"
                    className="font-mono text-lg tracking-wider"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                ) : (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email results: list of appointments */}
        {searched && !loading && appointments.length > 1 && !appointment && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-base mb-3">Tus citas ({appointments.length})</h3>
              <div className="space-y-2">
                {appointments.map(appt => (
                  <button
                    key={appt.id}
                    className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    onClick={() => setAppointment(appt)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{appt.services?.name || 'Cita'}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(appt.scheduled_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <Badge variant={STATUS_VARIANTS[appt.status] || 'outline'} className="text-xs">
                        {STATUS_LABELS[appt.status] || appt.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No results */}
        {searched && !loading && !appointment && appointments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron citas</p>
          </div>
        )}

        {appointment && (
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Detalles de tu cita</h3>
                <Badge variant={STATUS_VARIANTS[appointment.status] || 'outline'}>
                  {STATUS_LABELS[appointment.status] || appointment.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2.5">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-bold tracking-wider">{appointment.confirmation_code}</span>
              </div>
              {appointment.services && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{appointment.services.name}</div>
                    <div className="text-muted-foreground">{appointment.services.duration_minutes} min</div>
                  </div>
                </div>
              )}
              {appointment.staff && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{appointment.staff.name}</div>
                    <div className="text-muted-foreground">Profesional</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {format(new Date(appointment.scheduled_at), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                  <div className="text-muted-foreground">
                    {format(new Date(appointment.scheduled_at), 'HH:mm')} hrs
                  </div>
                </div>
              </div>
              {appointment.services && (
                <>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span style={{ color: 'var(--color-primary)' }}>${Number(appointment.services.price).toLocaleString('es-CO')}</span>
                  </div>
                </>
              )}

              {/* Botón de cancelar */}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-destructive/5 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>La cancelación es inmediata y no se puede deshacer. Debe realizarse con al menos 24 horas de anticipación.</span>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {cancelling ? 'Cancelando...' : 'Cancelar cita'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
