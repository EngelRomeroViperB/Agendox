import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Cancelar suscripción (no renueva al final del periodo)
export async function POST() {
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

  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, status')
    .eq('business_id', bu.business_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) {
    return NextResponse.json({ error: 'Sin suscripción' }, { status: 404 })
  }

  if (sub.status === 'cancelled') {
    return NextResponse.json({ error: 'Ya está cancelada' }, { status: 400 })
  }

  await admin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', sub.id)

  return NextResponse.json({ success: true })
}
