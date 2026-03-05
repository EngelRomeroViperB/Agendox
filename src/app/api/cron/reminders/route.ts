import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendReminder } from '@/lib/email/send'

// GET: Send reminders for appointments happening in the next hour
// Designed to be called by Vercel Cron every 15 minutes
export async function GET(request: Request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  // Find appointments in the next hour that haven't been reminded
  // We use a 15-min window to avoid double-sending
  const from = new Date(oneHourFromNow.getTime() - 15 * 60 * 1000).toISOString()
  const to = oneHourFromNow.toISOString()

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, businesses(name, slug), services(name, price, duration_minutes), staff(name)')
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .is('reminded_at', null)

  if (error) {
    console.error('[Cron] Error fetching appointments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0

  // Cachear notification_settings por negocio para no consultar varias veces
  const settingsCache: Record<string, any> = {}

  for (const appt of appointments || []) {
    const biz = appt.businesses as any
    const svc = appt.services as any
    const stf = appt.staff as any

    if (!appt.client_email) continue

    // Verificar toggle de recordatorios del negocio
    if (!settingsCache[appt.business_id]) {
      const { data: prof } = await supabase
        .from('business_profiles')
        .select('notification_settings')
        .eq('business_id', appt.business_id)
        .single()
      settingsCache[appt.business_id] = (prof as any)?.notification_settings || { reminder: true }
    }

    if (settingsCache[appt.business_id].reminder === false) {
      // Marcar como "recordado" para no volver a intentar
      await supabase
        .from('appointments')
        .update({ reminded_at: new Date().toISOString() } as any)
        .eq('id', appt.id)
      continue
    }

    try {
      await sendReminder({
        businessName: biz?.name || '',
        businessSlug: biz?.slug || '',
        clientName: appt.client_name,
        clientEmail: appt.client_email,
        serviceName: svc?.name || '',
        staffName: stf?.name || '',
        scheduledAt: appt.scheduled_at,
        confirmationCode: appt.confirmation_code,
        price: Number(svc?.price) || 0,
        duration: svc?.duration_minutes || 0,
      })

      await supabase
        .from('appointments')
        .update({ reminded_at: new Date().toISOString() } as any)
        .eq('id', appt.id)

      sent++
    } catch (err) {
      console.error(`[Cron] Failed to send reminder for ${appt.id}:`, err)
    }
  }

  console.log(`[Cron] Sent ${sent} reminders out of ${appointments?.length || 0} appointments`)

  return NextResponse.json({
    success: true,
    sent,
    total: appointments?.length || 0,
  })
}
