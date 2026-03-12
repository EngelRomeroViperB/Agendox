'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
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
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#121212' }}>
        <div className="animate-pulse text-sm uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh' }}>

      {/* Header de éxito */}
      <div className="py-16 px-4 text-center border-b border-white/5" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-xl mx-auto">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
          >
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1
            className="text-3xl md:text-4xl text-white mb-2"
            style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
          >
            ¡Cita Reservada!
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
            {business.name}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* Código de confirmación */}
        <div className="rounded-xl border border-white/10 p-6 text-center" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Tu código de reserva</p>
          <div className="inline-flex items-center gap-3">
            <span
              className="text-2xl md:text-3xl font-mono font-bold tracking-[0.3em]"
              style={{ color: 'var(--color-primary)' }}
            >
              {code}
            </span>
            <button
              onClick={copyCode}
              className="p-2 rounded-sm border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Guarda este código para consultar o cancelar tu cita
          </p>
        </div>

        {/* Detalles de la cita */}
        {appointment && (
          <div className="rounded-xl border border-white/10 p-6 space-y-5" style={{ backgroundColor: '#1a1a1a' }}>
            <h3
              className="text-lg text-white"
              style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
            >
              Detalles de tu cita
            </h3>
            <div className="w-full h-px bg-white/5" />

            {appointment.services && (
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-white font-medium">{appointment.services.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{appointment.services.duration_minutes} min</p>
                </div>
              </div>
            )}

            {appointment.staff && (
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
                >
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-white font-medium">{appointment.staff.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Profesional</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {format(new Date(appointment.scheduled_at), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                  {format(new Date(appointment.scheduled_at), 'HH:mm')} hrs
                </p>
              </div>
            </div>

            {appointment.services && (
              <>
                <div className="w-full h-px bg-white/5" />
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>
                    ${Number(appointment.services.price).toLocaleString('es-CO')}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Instrucciones post-reserva */}
        {profile.post_booking_instructions && (
          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(var(--color-primary), 0.3)' }}
          >
            <h3
              className="font-semibold text-xs mb-3 uppercase tracking-widest"
              style={{ color: 'var(--color-primary)' }}
            >
              Instrucciones
            </h3>
            <p className="text-sm text-gray-400 whitespace-pre-line">{profile.post_booking_instructions}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={addToGoogleCalendar}
            className="flex flex-col items-center gap-2 py-4 px-3 rounded-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all text-xs uppercase tracking-wider"
          >
            <CalendarPlus className="h-5 w-5" />
            Calendario
          </button>
          <button
            onClick={shareViaWhatsApp}
            className="flex flex-col items-center gap-2 py-4 px-3 rounded-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all text-xs uppercase tracking-wider"
          >
            <MessageCircle className="h-5 w-5" />
            Compartir
          </button>
          <Link href={`/${business.slug}/my-appointment`} className="block">
            <button className="w-full flex flex-col items-center gap-2 py-4 px-3 rounded-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all text-xs uppercase tracking-wider">
              <Calendar className="h-5 w-5" />
              Mis citas
            </button>
          </Link>
        </div>

        <Link href={`/${business.slug}`} className="block">
          <button className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 hover:text-gray-400 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Volver al portal
          </button>
        </Link>
      </div>
    </div>
  )
}
