import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Webhook de Wompi — recibe notificaciones de pago
export async function POST(request: Request) {
  const body = await request.json()

  const event = body.event

  // Log para debugging
  console.log('[Wompi Webhook]', event, body.data?.transaction?.status, body.data?.transaction?.reference)

  if (event !== 'transaction.updated') {
    return NextResponse.json({ ok: true })
  }

  const transaction = body.data?.transaction
  if (!transaction) {
    return NextResponse.json({ error: 'No transaction data' }, { status: 400 })
  }

  const { reference, status } = transaction
  const supabase = createAdminClient()

  if (status === 'APPROVED') {
    // Buscar suscripción por referencia del gateway
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('gateway_reference', reference)
      .single()

    if (sub) {
      const now = new Date()
      const cycle = sub.billing_cycle || 'monthly'
      const periodEnd = new Date(
        now.getTime() + (cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      )

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('id', sub.id)

      console.log(`[Wompi] Subscription ${sub.id} activated for business ${sub.business_id}`)
    } else {
      console.warn(`[Wompi] No subscription found for reference: ${reference}`)
    }
  } else if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
    // Pago fallido — marcar como pendiente de pago
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('gateway_reference', reference)
      .single()

    if (sub) {
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('id', sub.id)

      console.log(`[Wompi] Subscription ${sub.id} marked as past_due (payment ${status})`)
    }
  }

  return NextResponse.json({ ok: true })
}
