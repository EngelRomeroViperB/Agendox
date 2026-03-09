import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Listar todos los negocios (superadmin)
export async function GET() {
  const supabase = createAdminClient()

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_themes(*),
      business_profiles(*),
      appointments(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(businesses)
}

// POST: Crear nuevo negocio (superadmin)
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const {
    name,
    slug,
    business_type,
    is_active = true,
    theme,
    profile,
  } = body

  // 1. Crear el negocio
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({ name, slug, business_type, is_active })
    .select()
    .single()

  if (bizError) {
    return NextResponse.json({ error: bizError.message }, { status: 400 })
  }

  const businessId = business.id

  // 2. Crear tema visual
  const { error: themeError } = await supabase
    .from('business_themes')
    .insert({
      business_id: businessId,
      primary_color: theme?.primary_color || '#000000',
      secondary_color: theme?.secondary_color || '#ffffff',
      logo_url: theme?.logo_url || null,
      banner_url: theme?.banner_url || null,
      font: theme?.font || 'Inter',
    })

  if (themeError) {
    return NextResponse.json({ error: themeError.message }, { status: 400 })
  }

  // 3. Crear perfil del negocio
  const { error: profileError } = await supabase
    .from('business_profiles')
    .insert({
      business_id: businessId,
      description: profile?.description || null,
      address: profile?.address || null,
      phone: profile?.phone || null,
      email: profile?.email || null,
      social_links: profile?.social_links || {},
      gallery_urls: profile?.gallery_urls || [],
      working_hours: profile?.working_hours || {},
      post_booking_instructions: profile?.post_booking_instructions || null,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  // 4. Crear suscripción gratuita (trial 14 días)
  const { data: freePlan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('slug', 'free')
    .single()

  if (freePlan) {
    await supabase.from('subscriptions').insert({
      business_id: businessId,
      plan_id: freePlan.id,
      status: 'trialing',
      billing_cycle: 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return NextResponse.json(business, { status: 201 })
}
