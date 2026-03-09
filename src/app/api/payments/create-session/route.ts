import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Crear link de pago en Wompi para suscripción
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: bu } = await admin
    .from('business_users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!bu) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 })

  const body = await request.json()
  const { plan_id, billing_cycle } = body

  if (!plan_id) {
    return NextResponse.json({ error: 'Plan requerido' }, { status: 400 })
  }

  // Obtener plan
  const { data: plan } = await admin
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  }

  // Obtener negocio
  const { data: biz } = await admin
    .from('businesses')
    .select('name')
    .eq('id', bu.business_id)
    .single()

  const priceInCents = Math.round(
    Number(billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly) * 100
  )

  const reference = `agendox_${bu.business_id}_${Date.now()}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Crear transacción en Wompi via API
  const wompiBaseUrl = process.env.WOMPI_PRIVATE_KEY?.startsWith('prv_prod')
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1'
  const wompiRes = await fetch(`${wompiBaseUrl}/payment_links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    },
    body: JSON.stringify({
      name: `Suscripción ${plan.name} - ${biz?.name || 'Agendox'}`,
      description: `Plan ${plan.name} (${billing_cycle === 'yearly' ? 'Anual' : 'Mensual'})`,
      single_use: true,
      collect_shipping: false,
      currency: 'COP',
      amount_in_cents: priceInCents,
      redirect_url: `${appUrl}/admin/subscription?payment=success&reference=${reference}`,
      sku: reference,
      collect_customer_legal_id: false,
    }),
  })

  const wompiData = await wompiRes.json()

  if (!wompiRes.ok || wompiData.error) {
    console.error('[Wompi] Error creating payment link:', wompiData)
    return NextResponse.json(
      { error: 'Error al crear enlace de pago' },
      { status: 500 }
    )
  }

  // Guardar referencia temporalmente en la suscripción
  // Upsert: si ya hay suscripción, actualizar; si no, crear
  const { data: existingSub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('business_id', bu.business_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSub) {
    await admin
      .from('subscriptions')
      .update({
        gateway_reference: reference,
        gateway: 'wompi',
      } as Record<string, unknown>)
      .eq('id', existingSub.id)
  } else {
    await admin
      .from('subscriptions')
      .insert({
        business_id: bu.business_id,
        plan_id: plan.id,
        status: 'trialing',
        billing_cycle: billing_cycle || 'monthly',
        gateway: 'wompi',
        gateway_reference: reference,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (billing_cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      } as Record<string, unknown>)
  }

  return NextResponse.json({
    payment_url: wompiData.data?.url || `https://checkout.wompi.co/l/${wompiData.data?.id}`,
    reference,
  })
}
