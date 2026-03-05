'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBusiness } from '@/lib/context/business-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Clock, DollarSign, Check, Loader2, User } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="py-6 px-4" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
        <div className="max-w-3xl mx-auto">
          <Link href={`/${business.slug}`} className="text-sm opacity-80 hover:opacity-100 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Volver al portal
          </Link>
          <h1 className="text-2xl font-bold mt-2">{business.name}</h1>
          <p className="text-sm opacity-80">Agendar una cita</p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {['Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: step > i + 1 ? 'var(--color-primary)' : step === i + 1 ? 'var(--color-primary)' : '#e5e7eb',
                  color: step >= i + 1 ? 'var(--color-secondary)' : '#9ca3af',
                }}
              >
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-sm hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        {/* Paso 1 — Selección de Servicio */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Selecciona un servicio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((svc) => (
                <Card
                  key={svc.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedService?.id === svc.id ? 'ring-2' : ''}`}
                  style={selectedService?.id === svc.id ? { borderColor: 'var(--color-primary)' } : {}}
                  onClick={() => setSelectedService(svc)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{svc.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{svc.duration_minutes} min</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{Number(svc.price).toLocaleString('es-CO')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedService}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 2 — Selección de Profesional */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Selecciona un profesional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Opción sin preferencia */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${noPreference ? 'ring-2' : ''}`}
                style={noPreference ? { borderColor: 'var(--color-primary)' } : {}}
                onClick={() => { setNoPreference(true); setSelectedStaff(null) }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sin preferencia</h3>
                    <p className="text-sm text-muted-foreground">Asignar automáticamente</p>
                  </div>
                </CardContent>
              </Card>
              {availableStaff.map((member) => (
                <Card
                  key={member.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedStaff?.id === member.id ? 'ring-2' : ''}`}
                  style={selectedStaff?.id === member.id ? { borderColor: 'var(--color-primary)' } : {}}
                  onClick={() => { setSelectedStaff(member); setNoPreference(false) }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      {member.role && <p className="text-sm text-muted-foreground">{member.role}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedStaff && !noPreference}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3 — Fecha y Hora */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Selecciona fecha y hora</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date); setSelectedTime(null) }}
                  disabled={isDateDisabled}
                  fromDate={tomorrow}
                  toDate={addDays(new Date(), 30)}
                  locale={es}
                  className="rounded-md border"
                />
              </div>
              <div>
                {!selectedDate && (
                  <p className="text-muted-foreground text-sm">Selecciona una fecha para ver horarios disponibles</p>
                )}
                {selectedDate && loadingSlots && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios...
                  </div>
                )}
                {selectedDate && !loadingSlots && availableSlots.length === 0 && (
                  <p className="text-muted-foreground text-sm">No hay horarios disponibles para esta fecha</p>
                )}
                {selectedDate && !loadingSlots && availableSlots.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">
                      Horarios para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          style={selectedTime === time ? {
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-secondary)',
                          } : {}}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 4 — Datos del Cliente + Confirmación */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Confirma tu cita</h2>

            {/* Resumen */}
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Servicio:</span><span className="font-medium">{selectedService?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Profesional:</span><span className="font-medium">{noPreference ? 'Sin preferencia' : selectedStaff?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fecha:</span><span className="font-medium">{selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Hora:</span><span className="font-medium">{selectedTime}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duración:</span><span className="font-medium">{selectedService?.duration_minutes} min</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span>Precio:</span><span>${Number(selectedService?.price).toLocaleString('es-CO')}</span></div>
              </CardContent>
            </Card>

            {/* Formulario */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Juan Pérez" required />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+57 300 123 4567" required />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="juan@correo.com" required />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !clientName || !clientPhone || !clientEmail}
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {submitting ? 'Reservando...' : 'Confirmar reserva'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
