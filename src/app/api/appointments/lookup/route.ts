import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Buscar cita por código de confirmación o email
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const email = searchParams.get('email')
  const businessId = searchParams.get('business_id')

  if (!code && !email) {
    return NextResponse.json({ error: 'Código o email requerido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Search by email: return list of appointments
  if (email && !code) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        staff(name),
        services(name, duration_minutes, price)
      `)
      .eq('client_email', email.toLowerCase().trim())
      .order('scheduled_at', { ascending: false })
      .limit(10)

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'No se encontraron citas con ese email' }, { status: 404 })
    }

    return NextResponse.json({ appointments: data })
  }

  // Search by code: return single appointment
  let query = supabase
    .from('appointments')
    .select(`
      *,
      staff(name),
      services(name, duration_minutes, price)
    `)
    .eq('confirmation_code', code!)

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  return NextResponse.json(data)
}
