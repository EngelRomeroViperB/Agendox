import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

export async function GET() {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  const businessId = ctx.businessId

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
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('services')
    .insert({ ...body, business_id: ctx.businessId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body
  const admin = createAdminClient()

  const { error } = await admin
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('business_id', ctx.businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('services')
    .delete()
    .eq('id', id)
    .eq('business_id', ctx.businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
