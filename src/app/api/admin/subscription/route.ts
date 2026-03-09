import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

// GET: Get current subscription + plan for the authenticated business
export async function GET() {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const admin = createAdminClient()

  // Get subscription with plan details
  const { data: subscription } = await admin
    .from('subscriptions')
    .select(`
      *,
      subscription_plans(*)
    `)
    .eq('business_id', ctx.businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get usage counts + available plans
  const [staffRes, servicesRes, appointmentsRes, plansRes] = await Promise.all([
    admin.from('staff').select('id', { count: 'exact', head: true }).eq('business_id', ctx.businessId).eq('is_active', true),
    admin.from('services').select('id', { count: 'exact', head: true }).eq('business_id', ctx.businessId).eq('is_active', true),
    admin.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', ctx.businessId)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    admin.from('subscription_plans').select('*').eq('is_active', true).order('price_monthly', { ascending: true }),
  ])

  return NextResponse.json({
    subscription,
    plans: plansRes.data || [],
    usage: {
      staff: staffRes.count || 0,
      services: servicesRes.count || 0,
      appointments_this_month: appointmentsRes.count || 0,
    },
  })
}
