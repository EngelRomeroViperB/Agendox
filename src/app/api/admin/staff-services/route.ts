import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

// GET: obtener relaciones staff-services del negocio
export async function GET() {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('staff_services')
    .select('staff_id, service_id')
    .in('staff_id', (
      await admin.from('staff').select('id').eq('business_id', ctx.businessId)
    ).data?.map((s: { id: string }) => s.id) || [])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: asignar servicio(s) a un staff member
export async function POST(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const body = await request.json()
  const { staff_id, service_ids } = body as { staff_id: string; service_ids: string[] }

  if (!staff_id || !service_ids?.length) {
    return NextResponse.json({ error: 'staff_id y service_ids requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verificar que el staff pertenece al negocio
  const { data: staffCheck } = await admin
    .from('staff')
    .select('id')
    .eq('id', staff_id)
    .eq('business_id', ctx.businessId)
    .single()

  if (!staffCheck) return NextResponse.json({ error: 'Staff no encontrado' }, { status: 404 })

  // Borrar relaciones anteriores de este staff
  await admin.from('staff_services').delete().eq('staff_id', staff_id)

  // Insertar nuevas relaciones
  const rows = service_ids.map(service_id => ({ staff_id, service_id }))
  const { error } = await admin.from('staff_services').insert(rows)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// DELETE: quitar todos los servicios de un staff member
export async function DELETE(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const staffId = searchParams.get('staff_id')
  if (!staffId) return NextResponse.json({ error: 'staff_id requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('staff_services').delete().eq('staff_id', staffId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
