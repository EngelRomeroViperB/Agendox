import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

// GET: list employees of the business
export async function GET() {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  if (ctx.role !== 'owner') return NextResponse.json({ error: 'Solo el owner puede gestionar empleados' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('business_users')
    .select('id, role, staff_id')
    .eq('business_id', ctx.businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with user emails from auth
  const enriched = await Promise.all(
    (data || []).map(async (bu_row) => {
      const { data: { user: authUser } } = await admin.auth.admin.getUserById(bu_row.id)
      return {
        ...bu_row,
        email: authUser?.email || '—',
      }
    })
  )

  return NextResponse.json(enriched)
}

// POST: create a new employee account (invite via email/password)
export async function POST(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  if (ctx.role !== 'owner') return NextResponse.json({ error: 'Solo el owner' }, { status: 403 })

  const { email, password, staff_id } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })

  const admin = createAdminClient()

  // Create auth user
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'employee' },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Create business_user row
  const { error: buError } = await admin.from('business_users').insert({
    id: newUser.user.id,
    business_id: ctx.businessId,
    role: 'employee',
    staff_id: staff_id || null,
  })

  if (buError) {
    // Rollback: delete the auth user
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: buError.message }, { status: 400 })
  }

  return NextResponse.json({ id: newUser.user.id, email })
}

// PATCH: update employee (link/unlink staff_id)
export async function PATCH(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  if (ctx.role !== 'owner') return NextResponse.json({ error: 'Solo el owner' }, { status: 403 })

  const { employee_id, staff_id } = await request.json()
  if (!employee_id) return NextResponse.json({ error: 'employee_id requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('business_users')
    .update({ staff_id: staff_id || null })
    .eq('id', employee_id)
    .eq('business_id', ctx.businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// DELETE: remove employee account
export async function DELETE(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  if (ctx.role !== 'owner') return NextResponse.json({ error: 'Solo el owner' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('id')
  if (!employeeId) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  if (employeeId === ctx.userId) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })

  const admin = createAdminClient()

  // Delete business_user row first
  await admin.from('business_users').delete().eq('id', employeeId).eq('business_id', ctx.businessId)

  // Delete auth user
  await admin.auth.admin.deleteUser(employeeId)

  return NextResponse.json({ success: true })
}
