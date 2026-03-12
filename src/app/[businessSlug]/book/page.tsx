'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Clock, Check, Loader2, User } from 'lucide-react'
import { addDays, format, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Service, Staff } from '@/lib/types'

export default function BookAppointment() {
  const { business, profile, staff, services, staffServices } = useBusiness()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [noPreference, setNoPreference] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Filtrar staff que ofrece el servicio seleccionado
  const availableStaff = selectedService && staffServices.length > 0
    ? staff.filter(s => staffServices.some(ss => ss.staff_id === s.id && ss.service_id === selectedService.id))
    : staff

  const workingHours = profile.working_hours as Record<string, {
    is_open: boolean; open_time: string; close_time: string
  }> | null

  const tomorrow = addDays(startOfDay(new Date()), 1)

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, tomorrow)) return true
    if (!workingHours) return false
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    const dayKey = dayNames[date.getDay()]
    const dayHours = workingHours[dayKey]
    return !dayHours?.is_open
  }

  // Cargar slots cuando se selecciona una fecha
  useEffect(() => {
    if (!selectedDate || !selectedService || (!selectedStaff && !noPreference)) return

    const staffId = selectedStaff?.id
    if (!staffId && !noPreference) return

    setLoadingSlots(true)
    setSelectedTime(null)

    // Si no tiene preferencia, usar el primer staff disponible
    const targetStaffId = staffId || staff[0]?.id
    if (!targetStaffId) { setLoadingSlots(false); return }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    fetch(`/api/availability?business_id=${business.id}&staff_id=${targetStaffId}&service_id=${selectedService.id}&date=${dateStr}`)
      .then((res) => res.json())
      .then((slots) => {
        setAvailableSlots(Array.isArray(slots) ? slots : [])
        setLoadingSlots(false)
      })
      .catch(() => {
        setAvailableSlots([])
        setLoadingSlots(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, selectedStaff, noPreference])

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone || !clientEmail) {
      toast.error('Completa todos los campos')
      return
    }

    setSubmitting(true)
    const staffId = selectedStaff?.id || staff[0]?.id
    const scheduledAt = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          staff_id: staffId,
          service_id: selectedService.id,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          scheduled_at: scheduledAt,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push(`/${business.slug}/confirmation?code=${data.confirmation_code}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la cita')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh' }}>

      {/* Header */}
      <div className="py-5 px-4 border-b border-white/5" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/${business.slug}`}
            className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al portal
          </Link>
          <h1
            className="text-xl font-bold text-white"
            style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
          >
            {business.name}
          </h1>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--color-primary)' }}>
            Reserva tu cita
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Indicador de pasos */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-4 left-0 right-0 h-px bg-white/10" />
          <div
            className="absolute top-4 left-0 h-px transition-all duration-500"
            style={{
              backgroundColor: 'var(--color-primary)',
              width: `${((step - 1) / 3) * 100}%`,
            }}
          />
          {['Servicio', 'Profesional', 'Horario', 'Confirmar'].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor: step >= i + 1 ? 'var(--color-primary)' : '#1e1e1e',
                  color: step >= i + 1 ? 'var(--color-secondary)' : '#555',
                  border: step <= i ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
              >
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: step >= i + 1 ? 'var(--color-primary)' : '#555' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Paso 1 — Servicio */}
        {step === 1 && (
          <div className="space-y-6">
            <h2
              className="text-2xl text-white"
              style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
            >
              Selecciona un servicio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border"
                  style={{
                    backgroundColor: '#1E1E1E',
                    borderColor: selectedService?.id === svc.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                    boxShadow: selectedService?.id === svc.id ? '0 0 0 1px var(--color-primary)' : 'none',
                  }}
                  onClick={() => setSelectedService(svc)}
                >
                  {svc.image_url && (
                    <div className="relative h-28 overflow-hidden">
                      <img src={svc.image_url} alt={svc.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-white">{svc.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-tighter">
                        <Clock className="h-3 w-3" /> {svc.duration_minutes} min
                      </span>
                      <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                        ${Number(svc.price).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedService}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 2 — Profesional */}
        {step === 2 && (
          <div className="space-y-6">
            <h2
              className="text-2xl text-white"
              style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
            >
              Selecciona un profesional
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="rounded-lg cursor-pointer transition-all duration-200 border p-5 flex items-center gap-4"
                style={{
                  backgroundColor: '#1E1E1E',
                  borderColor: noPreference ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  boxShadow: noPreference ? '0 0 0 1px var(--color-primary)' : 'none',
                }}
                onClick={() => { setNoPreference(true); setSelectedStaff(null) }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#333' }}>
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sin preferencia</h3>
                  <p className="text-sm text-gray-500">Asignar automáticamente</p>
                </div>
              </div>
              {availableStaff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg cursor-pointer transition-all duration-200 border p-5 flex items-center gap-4"
                  style={{
                    backgroundColor: '#1E1E1E',
                    borderColor: selectedStaff?.id === member.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                    boxShadow: selectedStaff?.id === member.id ? '0 0 0 1px var(--color-primary)' : 'none',
                  }}
                  onClick={() => { setSelectedStaff(member); setNoPreference(false) }}
                >
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #333, #222)',
                        outline: '1px solid var(--color-primary)',
                        outlineOffset: '2px',
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    {member.role && (
                      <p className="text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-primary)' }}>
                        {member.role}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedStaff && !noPreference}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 — Fecha y Hora */}
        {step === 3 && (
          <div className="space-y-6">
            <h2
              className="text-2xl text-white"
              style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
            >
              Selecciona fecha y hora
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div
                className="rounded-xl border border-white/10 overflow-hidden p-1"
                style={{
                  '--background': '0 0% 12%',
                  '--foreground': '0 0% 88%',
                  '--accent': '0 0% 20%',
                  '--accent-foreground': '0 0% 88%',
                  '--muted': '0 0% 16%',
                  '--muted-foreground': '0 0% 55%',
                  '--border': '0 0% 22%',
                  '--primary': '0 0% 88%',
                  '--primary-foreground': '0 0% 10%',
                } as React.CSSProperties}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date); setSelectedTime(null) }}
                  disabled={isDateDisabled}
                  fromDate={tomorrow}
                  toDate={addDays(new Date(), 30)}
                  locale={es}
                  className="w-full"
                />
              </div>
              <div>
                {!selectedDate && (
                  <p className="text-gray-500 text-sm mt-4">
                    Selecciona una fecha para ver horarios disponibles
                  </p>
                )}
                {selectedDate && loadingSlots && (
                  <div className="flex items-center gap-2 text-gray-500 mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios...
                  </div>
                )}
                {selectedDate && !loadingSlots && availableSlots.length === 0 && (
                  <p className="text-gray-500 text-sm mt-4">No hay horarios disponibles para esta fecha</p>
                )}
                {selectedDate && !loadingSlots && availableSlots.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
                      {format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className="py-2.5 px-3 rounded-sm text-sm font-medium border transition-all"
                          style={{
                            backgroundColor: selectedTime === time ? 'var(--color-primary)' : '#1e1e1e',
                            borderColor: selectedTime === time ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                            color: selectedTime === time ? 'var(--color-secondary)' : '#aaa',
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Paso 4 — Confirmar */}
        {step === 4 && (
          <div className="space-y-6">
            <h2
              className="text-2xl text-white"
              style={{ fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif' }}
            >
              Confirma tu cita
            </h2>

            {/* Resumen */}
            <div className="rounded-lg border border-white/10 p-5 space-y-3" style={{ backgroundColor: '#1e1e1e' }}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Servicio</span>
                <span className="text-white font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Profesional</span>
                <span className="text-white font-medium">{noPreference ? 'Sin preferencia' : selectedStaff?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha</span>
                <span className="text-white font-medium">
                  {selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hora</span>
                <span className="text-white font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duración</span>
                <span className="text-white font-medium">{selectedService?.duration_minutes} min</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span className="text-gray-300">Precio</span>
                <span style={{ color: 'var(--color-primary)' }}>
                  ${Number(selectedService?.price).toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-500">Nombre completo</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full rounded-sm px-4 py-3 text-sm border border-white/10 bg-[#1e1e1e] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-500">Teléfono</label>
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full rounded-sm px-4 py-3 text-sm border border-white/10 bg-[#1e1e1e] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-500">Correo electrónico</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="juan@correo.com"
                  className="w-full rounded-sm px-4 py-3 text-sm border border-white/10 bg-[#1e1e1e] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !clientName || !clientPhone || !clientEmail}
                className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-sm uppercase tracking-widest text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {submitting ? 'Reservando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
