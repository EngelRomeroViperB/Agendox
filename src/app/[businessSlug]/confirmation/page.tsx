'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Copy, Calendar, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
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

export default function Confirmation() {
  const { business, profile } = useBusiness()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) { setLoading(false); return }
    fetch(`/api/appointments/lookup?code=${code}&business_id=${business.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setAppointment(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [code, business.id])

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      toast.success('Código copiado al portapapeles')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-4" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold">{business.name}</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-2xl font-bold mb-2">¡Cita Reservada!</h2>
          <p className="text-muted-foreground">Tu cita ha sido registrada exitosamente</p>
        </div>

        {/* Código de confirmación */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Tu código de reserva</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest" style={{ color: 'var(--color-primary)' }}>
                {code}
              </span>
              <Button variant="ghost" size="icon" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Guarda este código para consultar o cancelar tu cita
            </p>
          </CardContent>
        </Card>

        {/* Resumen de la cita */}
        {appointment && (
          <Card className="mb-6">
            <CardContent className="p-5 space-y-3 text-sm">
              <h3 className="font-semibold text-base">Detalles de tu cita</h3>
              <Separator />
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración:</span>
                    <span className="font-medium">{appointment.services.duration_minutes} min</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Precio:</span>
                    <span>${Number(appointment.services.price).toLocaleString('es-CO')}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instrucciones post-reserva */}
        {profile.post_booking_instructions && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-2">Instrucciones</h3>
              <p className="text-sm text-muted-foreground">{profile.post_booking_instructions}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <Link href={`/${business.slug}/my-appointment`}>
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Consultar o cancelar mi cita
            </Button>
          </Link>
          <Link href={`/${business.slug}`}>
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
