import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addMinutes, format, parse, isBefore, isEqual } from 'date-fns'

// GET: Calcular slots disponibles para un profesional en una fecha
// Query params: business_id, staff_id, service_id, date (YYYY-MM-DD)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('business_id')
  const staffId = searchParams.get('staff_id')
  const serviceId = searchParams.get('service_id')
  const dateStr = searchParams.get('date')

  if (!businessId || !staffId || !serviceId || !dateStr) {
    return NextResponse.json(
      { error: 'business_id, staff_id, service_id y date son requeridos' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // 1. Obtener duración del servicio
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const duration = service.duration_minutes

  // 2. Obtener horario del negocio
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('working_hours')
    .eq('business_id', businessId)
    .single()

  // 3. Obtener horario del profesional
  const { data: staffMember } = await supabase
    .from('staff')
    .select('working_hours')
    .eq('id', staffId)
    .single()

  if (!profile || !staffMember) {
    return NextResponse.json({ error: 'Datos no encontrados' }, { status: 404 })
  }

  // Determinar el día de la semana en español
  const dateObj = new Date(dateStr + 'T12:00:00')
  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayKey = dayNames[dateObj.getDay()]

  const businessHours = (profile.working_hours as Record<string, {
    is_open: boolean; open_time: string; close_time: string;
    break_start?: string; break_end?: string
  }>) || {}

  const staffHours = (staffMember.working_hours as Record<string, {
    is_open: boolean; open_time: string; close_time: string;
    break_start?: string; break_end?: string
  }>) || {}

  const bizDay = businessHours[dayKey]
  const staffDay = staffHours[dayKey]

  // Si el negocio o el profesional no trabaja ese día
  if (!bizDay?.is_open) {
    return NextResponse.json([])
  }
  if (staffDay && !staffDay.is_open) {
    return NextResponse.json([])
  }

  // Calcular rango de trabajo: intersección entre negocio y staff
  const openTime = staffDay?.open_time && staffDay.open_time > bizDay.open_time
    ? staffDay.open_time : bizDay.open_time
  const closeTime = staffDay?.close_time && staffDay.close_time < bizDay.close_time
    ? staffDay.close_time : bizDay.close_time

  // 4. Obtener citas existentes para ese profesional en esa fecha
  const dayStart = `${dateStr}T00:00:00`
  const dayEnd = `${dateStr}T23:59:59`

  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('scheduled_at, services(duration_minutes)')
    .eq('staff_id', staffId)
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .neq('status', 'cancelled')

  // Construir lista de bloques ocupados
  const occupied: { start: Date; end: Date }[] = (existingAppointments || []).map((apt: {
    scheduled_at: string;
    services: { duration_minutes: number } | { duration_minutes: number }[] | null
  }) => {
    const aptStart = new Date(apt.scheduled_at)
    const aptDuration = Array.isArray(apt.services)
      ? (apt.services[0]?.duration_minutes || 30)
      : (apt.services?.duration_minutes || 30)
    return { start: aptStart, end: addMinutes(aptStart, aptDuration) }
  })

  // 5. Generar slots
  const slots: string[] = []
  const baseDate = dateStr
  let current = parse(openTime, 'HH:mm', new Date(`${baseDate}T00:00:00`))
  const end = parse(closeTime, 'HH:mm', new Date(`${baseDate}T00:00:00`))

  // Breaks
  const breakStart = bizDay.break_start
    ? parse(bizDay.break_start, 'HH:mm', new Date(`${baseDate}T00:00:00`))
    : null
  const breakEnd = bizDay.break_end
    ? parse(bizDay.break_end, 'HH:mm', new Date(`${baseDate}T00:00:00`))
    : null

  while (isBefore(addMinutes(current, duration), end) || isEqual(addMinutes(current, duration), end)) {
    const slotEnd = addMinutes(current, duration)

    // Verificar si el slot cae en el break
    const inBreak = breakStart && breakEnd &&
      isBefore(current, breakEnd) && isBefore(breakStart, slotEnd)

    // Verificar si el slot se superpone con una cita existente
    const isOccupied = occupied.some(
      (occ) => isBefore(current, occ.end) && isBefore(occ.start, slotEnd)
    )

    if (!inBreak && !isOccupied) {
      slots.push(format(current, 'HH:mm'))
    }

    current = addMinutes(current, 30) // Avanzar en bloques de 30 min
  }

  return NextResponse.json(slots)
}
