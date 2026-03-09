import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

// GET: Listar citas del negocio del admin autenticado
export async function GET(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const admin = createAdminClient()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const staffIdParam = searchParams.get('staff_id')

  let query = admin
    .from('appointments')
    .select(`
      *,
      staff(name),
      services(name, duration_minutes, price)
    `)
    .eq('business_id', ctx.businessId)
    .order('scheduled_at', { ascending: true })

  // Si es empleado con staff_id vinculado, filtrar solo sus citas
  if (ctx.role === 'employee' && ctx.staffId) {
    query = query.eq('staff_id', ctx.staffId)
  } else if (staffIdParam) {
    query = query.eq('staff_id', staffIdParam)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (from) {
    query = query.gte('scheduled_at', from)
  }
  if (to) {
    query = query.lte('scheduled_at', to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ appointments: data, business_id: ctx.businessId })
}

// PATCH: Actualizar estado de una cita
export async function PATCH(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json()
  const { appointment_id, status } = body

  if (!appointment_id || !status) {
    return NextResponse.json({ error: 'appointment_id y status requeridos' }, { status: 400 })
  }

  const { error } = await admin
    .from('appointments')
    .update({ status })
    .eq('id', appointment_id)
    .eq('business_id', ctx.businessId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
