import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Crear staff para un negocio (superadmin - bulk)
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { business_id, staff } = body

  if (!business_id || !staff?.length) {
    return NextResponse.json(
      { error: 'business_id y staff son requeridos' },
      { status: 400 }
    )
  }

  const rows = staff.map((s: { name: string; role: string }) => ({
    business_id,
    name: s.name,
    role: s.role || '',
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('staff')
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
