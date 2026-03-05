'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Copy, Calendar, ArrowLeft, Clock, User, MessageCircle, CalendarPlus } from 'lucide-react'
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

  const shareViaWhatsApp = () => {
    if (!appointment) return
    const dateStr = format(new Date(appointment.scheduled_at), "d 'de' MMMM, yyyy", { locale: es })
    const timeStr = format(new Date(appointment.scheduled_at), 'HH:mm')
    const msg = `¡Reservé una cita en ${business.name}!\n📅 ${dateStr} a las ${timeStr}\n✂️ ${appointment.services?.name || ''}\nCódigo: ${code}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const addToGoogleCalendar = () => {
    if (!appointment) return
    const start = new Date(appointment.scheduled_at)
    const end = new Date(start.getTime() + (appointment.services?.duration_minutes || 30) * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${appointment.services?.name || 'Cita'} — ${business.name}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `Profesional: ${appointment.staff?.name || ''}\nCódigo: ${code}`,
      location: profile.address || '',
    })
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success header */}
      <div className="relative overflow-hidden">
        <div
          className="py-12 px-4 text-center"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
        >
          <div className="max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">¡Cita Reservada!</h1>
            <p className="opacity-80">{business.name}</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-50 rounded-t-3xl" />
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-2 pb-12">
        {/* Código de confirmación */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Tu código de reserva</p>
            <div className="inline-flex items-center gap-2 bg-muted rounded-xl px-6 py-3">
              <span className="text-2xl md:text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: 'var(--color-primary)' }}>
                {code}
              </span>
              <Button variant="ghost" size="icon" onClick={copyCode} className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Guarda este código para consultar o cancelar tu cita
            </p>
          </CardContent>
        </Card>

        {/* Resumen de la cita */}
        {appointment && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-base">Detalles de tu cita</h3>
              <Separator />
              {appointment.services && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{appointment.staff.name}</div>
                    <div className="text-muted-foreground">Profesional</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
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
            </CardContent>
          </Card>
        )}

        {/* Instrucciones post-reserva */}
        {profile.post_booking_instructions && (
          <Card className="mb-6 border-0 shadow-sm border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-2">📋 Instrucciones</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.post_booking_instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={addToGoogleCalendar} className="h-auto py-3">
              <div className="flex flex-col items-center gap-1">
                <CalendarPlus className="h-5 w-5" />
                <span className="text-xs">Calendario</span>
              </div>
            </Button>
            <Button variant="outline" onClick={shareViaWhatsApp} className="h-auto py-3">
              <div className="flex flex-col items-center gap-1">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Compartir</span>
              </div>
            </Button>
            <Link href={`/${business.slug}/my-appointment`} className="block">
              <Button variant="outline" className="w-full h-auto py-3">
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Mis citas</span>
                </div>
              </Button>
            </Link>
          </div>
          <Link href={`/${business.slug}`}>
            <Button variant="ghost" className="w-full text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
