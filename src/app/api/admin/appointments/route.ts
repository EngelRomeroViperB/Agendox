import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Listar citas del negocio del admin autenticado
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Obtener business_id del usuario
  const { data: businessUser } = await admin
    .from('business_users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!businessUser) {
    return NextResponse.json({ error: 'Sin negocio asociado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = admin
    .from('appointments')
    .select(`
      *,
      staff(name),
      services(name, duration_minutes, price)
    `)
    .eq('business_id', businessUser.business_id)
    .order('scheduled_at', { ascending: true })

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

  return NextResponse.json({ appointments: data, business_id: businessUser.business_id })
}

// PATCH: Actualizar estado de una cita
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const body = await request.json()
  const { appointment_id, status } = body

  if (!appointment_id || !status) {
    return NextResponse.json({ error: 'appointment_id y status requeridos' }, { status: 400 })
  }

  // Verificar que la cita pertenece al negocio del admin
  const { data: businessUser } = await admin
    .from('business_users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!businessUser) {
    return NextResponse.json({ error: 'Sin negocio asociado' }, { status: 403 })
  }

  const { error } = await admin
    .from('appointments')
    .update({ status })
    .eq('id', appointment_id)
    .eq('business_id', businessUser.business_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
