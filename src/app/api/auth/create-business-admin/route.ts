import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Crear usuario admin para un negocio (superadmin)
export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { email, password, business_id, role = 'owner' } = body

  if (!email || !password || !business_id) {
    return NextResponse.json(
      { error: 'email, password y business_id son requeridos' },
      { status: 400 }
    )
  }

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 2. Crear registro en business_users
  const { error: buError } = await supabase
    .from('business_users')
    .insert({
      id: authData.user.id,
      business_id,
      role,
    })

  if (buError) {
    // Rollback: eliminar usuario de auth si falla
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: buError.message }, { status: 400 })
  }

  return NextResponse.json({ user_id: authData.user.id }, { status: 201 })
}
