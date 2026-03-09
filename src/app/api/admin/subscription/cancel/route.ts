import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

// POST: Cancelar suscripción (no renueva al final del periodo)
export async function POST() {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, status')
    .eq('business_id', ctx.businessId)
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
