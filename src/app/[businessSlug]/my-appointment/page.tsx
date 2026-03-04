'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
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
  const [code, setCode] = useState('')
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!code.trim()) {
      toast.error('Ingresa un código de reserva')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/appointments/lookup?code=${code.trim()}&business_id=${business.id}`)
      const data = await res.json()

      if (res.ok && data && !data.error) {
        setAppointment(data)
      } else {
        setAppointment(null)
        toast.error('No se encontró una cita con ese código')
      }
    } catch {
      setAppointment(null)
      toast.error('Error al buscar la cita')
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
        toast.error('Error al cancelar la cita')
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
            <h2 className="text-lg font-bold mb-4">Ingresa tu código de reserva</h2>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="code" className="sr-only">Código</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC12345"
                  className="font-mono text-lg tracking-wider"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
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

        {/* Resultado */}
        {searched && !loading && !appointment && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontró ninguna cita con ese código</p>
          </div>
        )}

        {appointment && (
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Detalles de tu cita</h3>
                <Badge variant={STATUS_VARIANTS[appointment.status] || 'outline'}>
                  {STATUS_LABELS[appointment.status] || appointment.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-bold">{appointment.confirmation_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{appointment.client_name}</span>
              </div>
              {appointment.services && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="font-medium">{appointment.services.name}</span>
                </div>
              )}
              {appointment.staff && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profesional:</span>
                  <span className="font-medium">{appointment.staff.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">
                  {format(new Date(appointment.scheduled_at), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora:</span>
                <span className="font-medium">
                  {format(new Date(appointment.scheduled_at), 'HH:mm')}
                </span>
              </div>
              {appointment.services && (
                <>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Precio:</span>
                    <span>${Number(appointment.services.price).toLocaleString('es-CO')}</span>
                  </div>
                </>
              )}

              {/* Botón de cancelar */}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <>
                  <Separator />
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
