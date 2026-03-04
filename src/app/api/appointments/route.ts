import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// POST: Crear una cita (público)
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const {
    business_id,
    staff_id,
    service_id,
    client_name,
    client_phone,
    client_email,
    scheduled_at,
    notes,
  } = body

  if (!business_id || !staff_id || !service_id || !client_name || !client_phone || !client_email || !scheduled_at) {
    return NextResponse.json(
      { error: 'Todos los campos son requeridos' },
      { status: 400 }
    )
  }

  const confirmation_code = generateConfirmationCode()

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      business_id,
      staff_id,
      service_id,
      client_name,
      client_phone,
      client_email,
      scheduled_at,
      notes: notes || null,
      confirmation_code,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
