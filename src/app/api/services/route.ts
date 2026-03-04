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
