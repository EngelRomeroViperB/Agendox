'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
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
    <div style={{ backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh' }}>

      {/* Header */}
      <div className="py-5 px-4 border-b border-white/5" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-xl mx-auto">
          <Link
            href={`/${business.slug}`}
            className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al portal
          </Link>
          <h1
            className="text-2xl font-bold text-white mt-1"
            style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
          >
            {business.name}
          </h1>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--color-primary)' }}>
            Consultar mi cita
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">

        {/* Buscador */}
        <div className="rounded-xl border border-white/10 p-6 mb-8" style={{ backgroundColor: '#1a1a1a' }}>
          <h2
            className="text-lg text-white mb-5"
            style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
          >
            Buscar mi cita
          </h2>
          <div className="flex gap-1 mb-5">
            <button
              onClick={() => { setSearchMode('code'); setSearched(false); setAppointment(null); setAppointments([]) }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-sm text-xs uppercase tracking-wider font-semibold border transition-all"
              style={
                searchMode === 'code'
                  ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', borderColor: 'var(--color-primary)' }
                  : { backgroundColor: 'transparent', color: '#777', borderColor: 'rgba(255,255,255,0.08)' }
              }
            >
              <Hash className="h-3.5 w-3.5" /> Código
            </button>
            <button
              onClick={() => { setSearchMode('email'); setSearched(false); setAppointment(null); setAppointments([]) }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-sm text-xs uppercase tracking-wider font-semibold border transition-all"
              style={
                searchMode === 'email'
                  ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', borderColor: 'var(--color-primary)' }
                  : { backgroundColor: 'transparent', color: '#777', borderColor: 'rgba(255,255,255,0.08)' }
              }
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              {searchMode === 'code' ? (
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC12345"
                  className="w-full rounded-sm px-4 py-3 text-sm border border-white/10 bg-[#121212] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)] font-mono tracking-wider transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-sm px-4 py-3 text-sm border border-white/10 bg-[#121212] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-12 flex items-center justify-center rounded-sm border border-transparent transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Lista de citas (por email) */}
        {searched && !loading && appointments.length > 1 && !appointment && (
          <div className="rounded-xl border border-white/10 p-5 mb-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4">
              Tus citas ({appointments.length})
            </h3>
            <div className="space-y-2">
              {appointments.map(appt => (
                <button
                  key={appt.id}
                  className="w-full text-left rounded-lg p-4 border border-white/5 hover:border-white/20 transition-colors"
                  style={{ backgroundColor: '#121212' }}
                  onClick={() => setAppointment(appt)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-white">{appt.services?.name || 'Cita'}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {format(new Date(appt.scheduled_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-sm uppercase tracking-wider font-semibold border border-white/10"
                      style={{
                        color: appt.status === 'cancelled' ? '#ef4444' : appt.status === 'completed' ? '#666' : 'var(--color-primary)',
                      }}
                    >
                      {STATUS_LABELS[appt.status] || appt.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {searched && !loading && !appointment && appointments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron citas</p>
          </div>
        )}

        {/* Detalle de cita */}
        {appointment && (
          <div className="rounded-xl border border-white/10 p-6 space-y-5 mb-6" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center justify-between">
              <h3
                className="text-lg text-white"
                style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
              >
                Detalles de tu cita
              </h3>
              <span
                className="text-xs px-3 py-1.5 rounded-sm uppercase tracking-wider font-semibold border"
                style={{
                  borderColor: appointment.status === 'cancelled' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
                  color: appointment.status === 'cancelled' ? '#ef4444' : appointment.status === 'completed' ? '#666' : 'var(--color-primary)',
                }}
              >
                {STATUS_LABELS[appointment.status] || appointment.status}
              </span>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="rounded-lg px-5 py-3" style={{ backgroundColor: '#121212' }}>
              <span className="text-xs uppercase tracking-widest text-gray-500">Código de reserva</span>
              <p className="font-mono font-bold tracking-[0.3em] text-lg text-white mt-1">
                {appointment.confirmation_code}
              </p>
            </div>

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

            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <>
                <div className="w-full h-px bg-white/5" />
                <div className="flex items-start gap-3 text-xs text-gray-500 bg-red-950/20 border border-red-900/20 rounded-lg p-4">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>La cancelación es inmediata y no se puede deshacer. Debe realizarse con al menos 24 horas de anticipación.</span>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-sm border border-red-900/40 text-red-500 uppercase tracking-wider text-sm font-semibold transition-all hover:bg-red-950/30 disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  {cancelling ? 'Cancelando...' : 'Cancelar cita'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
