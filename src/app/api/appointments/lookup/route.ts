import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Buscar cita por código de confirmación
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const businessId = searchParams.get('business_id')

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  let query = supabase
    .from('appointments')
    .select(`
      *,
      staff(name),
      services(name, duration_minutes, price)
    `)
    .eq('confirmation_code', code)

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  return NextResponse.json(data)
}
