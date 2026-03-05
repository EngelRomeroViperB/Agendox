import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET: Get current subscription + plan for the authenticated business
export async function GET() {
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

  // Get subscription with plan details
  const { data: subscription } = await admin
    .from('subscriptions')
    .select(`
      *,
      subscription_plans(*)
    `)
    .eq('business_id', bu.business_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Get usage counts
  const [staffRes, servicesRes, appointmentsRes] = await Promise.all([
    admin.from('staff').select('id', { count: 'exact', head: true }).eq('business_id', bu.business_id).eq('is_active', true),
    admin.from('services').select('id', { count: 'exact', head: true }).eq('business_id', bu.business_id).eq('is_active', true),
    admin.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', bu.business_id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  return NextResponse.json({
    subscription,
    usage: {
      staff: staffRes.count || 0,
      services: servicesRes.count || 0,
      appointments_this_month: appointmentsRes.count || 0,
    },
  })
}
