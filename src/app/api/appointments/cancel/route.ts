import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Cancelar cita por código de confirmación
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { confirmation_code, business_id } = body

  if (!confirmation_code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  let query = supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('confirmation_code', confirmation_code)
    .neq('status', 'cancelled')

  if (business_id) {
    query = query.eq('business_id', business_id)
  }

  const { error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
