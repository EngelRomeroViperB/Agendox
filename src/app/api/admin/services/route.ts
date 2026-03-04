import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getBusinessId(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('business_users')
    .select('business_id')
    .eq('id', userId)
    .single()
  return data?.business_id || null
}

export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const businessId = await getBusinessId(session.user.id)
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const businessId = await getBusinessId(session.user.id)
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 })

  const body = await request.json()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('services')
    .insert({ ...body, business_id: businessId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const businessId = await getBusinessId(session.user.id)
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 })

  const body = await request.json()
  const { id, ...updates } = body
  const admin = createAdminClient()

  const { error } = await admin
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('business_id', businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const businessId = await getBusinessId(session.user.id)
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('services')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
