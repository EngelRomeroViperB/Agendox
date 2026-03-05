import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendCancellationNotification } from '@/lib/email/send'

// POST: Cancelar cita por código de confirmación
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { confirmation_code, business_id } = body

  if (!confirmation_code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  // Fetch appointment details before cancelling (for email)
  let lookupQuery = supabase
    .from('appointments')
    .select('*, businesses(name, slug), services(name, price, duration_minutes), staff(name)')
    .eq('confirmation_code', confirmation_code)
    .neq('status', 'cancelled')

  if (business_id) {
    lookupQuery = lookupQuery.eq('business_id', business_id)
  }

  const { data: appointment } = await lookupQuery.single()

  // Perform cancellation
  let query = supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('confirmation_code', confirmation_code)
    .neq('status', 'cancelled')

  if (business_id) {
    query = query.eq('business_id', business_id)
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Send cancellation email (non-blocking)
  if (appointment?.client_email) {
    const biz = appointment.businesses as any
    const svc = appointment.services as any
    const stf = appointment.staff as any
    sendCancellationNotification({
      businessName: biz?.name || '',
      businessSlug: biz?.slug || '',
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      serviceName: svc?.name || '',
      staffName: stf?.name || '',
      scheduledAt: appointment.scheduled_at,
      confirmationCode: confirmation_code,
      price: Number(svc?.price) || 0,
      duration: svc?.duration_minutes || 0,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
