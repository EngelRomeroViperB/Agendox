import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Crear servicios para un negocio (superadmin - bulk)
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { business_id, services } = body

  if (!business_id || !services?.length) {
    return NextResponse.json(
      { error: 'business_id y services son requeridos' },
      { status: 400 }
    )
  }

  const rows = services.map((s: { name: string; duration_minutes: number; price: number }) => ({
    business_id,
    name: s.name,
    duration_minutes: s.duration_minutes,
    price: s.price,
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('services')
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}

// DELETE: Eliminar servicio por ID (superadmin)
export async function DELETE(request: Request) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const business_id = searchParams.get('business_id')

  if (!id || !business_id) {
    return NextResponse.json({ error: 'id y business_id son requeridos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('business_id', business_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
