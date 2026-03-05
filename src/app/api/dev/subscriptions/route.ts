import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verifySuperadmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (user.app_metadata?.role !== 'superadmin') return null
  return user
}

// GET: list all plans + all subscriptions
export async function GET(request: Request) {
  const user = await verifySuperadmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'plans'

  if (type === 'plans') {
    const { data } = await admin
      .from('subscription_plans')
      .select('*')
      .order('sort_order')
    return NextResponse.json(data || [])
  }

  // type === 'subscriptions'
  const { data } = await admin
    .from('subscriptions')
    .select(`
      *,
      subscription_plans(name, slug),
      businesses(name, slug)
    `)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

// POST: create/assign subscription to a business
export async function POST(request: Request) {
  const user = await verifySuperadmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { business_id, plan_id, status, billing_cycle, period_months } = await request.json()

  if (!business_id || !plan_id) {
    return NextResponse.json({ error: 'business_id y plan_id requeridos' }, { status: 400 })
  }

  const now = new Date()
  const months = period_months || (billing_cycle === 'yearly' ? 12 : 1)
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + months)

  // Expire any existing active subscription
  await admin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('business_id', business_id)
    .in('status', ['trialing', 'active'])

  const { data, error } = await admin.from('subscriptions').insert({
    business_id,
    plan_id,
    status: status || 'active',
    billing_cycle: billing_cycle || 'monthly',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    trial_ends_at: status === 'trialing' ? periodEnd.toISOString() : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// PATCH: update subscription status
export async function PATCH(request: Request) {
  const user = await verifySuperadmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { subscription_id, status } = await request.json()

  if (!subscription_id || !status) {
    return NextResponse.json({ error: 'subscription_id y status requeridos' }, { status: 400 })
  }

  const update: Record<string, string> = { status }
  if (status === 'cancelled') update.cancelled_at = new Date().toISOString()

  const { error } = await admin
    .from('subscriptions')
    .update(update)
    .eq('id', subscription_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
