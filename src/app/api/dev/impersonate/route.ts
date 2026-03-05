import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST: Set impersonation cookie
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { business_id } = await request.json()

  if (!business_id) {
    return NextResponse.json({ error: 'business_id requerido' }, { status: 400 })
  }

  // Verify business exists
  const admin = createAdminClient()
  const { data: biz } = await admin
    .from('businesses')
    .select('id, name')
    .eq('id', business_id)
    .single()

  if (!biz) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  }

  const cookieStore = cookies()
  cookieStore.set('x-impersonate-business', business_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  })

  return NextResponse.json({ success: true, business: biz })
}

// DELETE: Clear impersonation cookie
export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('x-impersonate-business')
  return NextResponse.json({ success: true })
}

// GET: Check current impersonation status
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'superadmin') {
    return NextResponse.json({ impersonating: false })
  }

  const cookieStore = cookies()
  const businessId = cookieStore.get('x-impersonate-business')?.value

  if (!businessId) {
    return NextResponse.json({ impersonating: false })
  }

  const admin = createAdminClient()
  const { data: biz } = await admin
    .from('businesses')
    .select('id, name, slug')
    .eq('id', businessId)
    .single()

  return NextResponse.json({
    impersonating: true,
    business: biz,
  })
}
