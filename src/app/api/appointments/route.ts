import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendBookingConfirmation } from '@/lib/email/send'

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

  // Send email notification (non-blocking)
  try {
    const [bizRes, svcRes, staffRes] = await Promise.all([
      supabase.from('businesses').select('name, slug').eq('id', business_id).single(),
      supabase.from('services').select('name, price, duration_minutes').eq('id', service_id).single(),
      supabase.from('staff').select('name').eq('id', staff_id).single(),
    ])

    sendBookingConfirmation({
      businessName: bizRes.data?.name || '',
      businessSlug: bizRes.data?.slug || '',
      clientName: client_name,
      clientEmail: client_email,
      serviceName: svcRes.data?.name || '',
      staffName: staffRes.data?.name || '',
      scheduledAt: scheduled_at,
      confirmationCode: confirmation_code,
      price: Number(svcRes.data?.price) || 0,
      duration: svcRes.data?.duration_minutes || 0,
    }).catch(() => {})
  } catch {
    // Email sending should not block the response
  }

  return NextResponse.json(data, { status: 201 })
}
