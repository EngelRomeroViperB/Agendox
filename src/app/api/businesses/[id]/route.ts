import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Obtener negocio por ID (superadmin)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_themes(*),
      business_profiles(*),
      staff(*),
      services(*)
    `)
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(business)
}

// PATCH: Actualizar negocio (superadmin)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()
  const body = await request.json()

  const { name, slug, business_type, is_active, theme, profile } = body

  // Actualizar datos del negocio
  const businessUpdate: Record<string, unknown> = {}
  if (name !== undefined) businessUpdate.name = name
  if (slug !== undefined) businessUpdate.slug = slug
  if (business_type !== undefined) businessUpdate.business_type = business_type
  if (is_active !== undefined) businessUpdate.is_active = is_active

  if (Object.keys(businessUpdate).length > 0) {
    const { error } = await supabase
      .from('businesses')
      .update(businessUpdate)
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // Actualizar tema si se proporcionó
  if (theme) {
    const { error } = await supabase
      .from('business_themes')
      .update(theme)
      .eq('business_id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // Actualizar perfil si se proporcionó
  if (profile) {
    const { error } = await supabase
      .from('business_profiles')
      .update(profile)
      .eq('business_id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}

// DELETE: Eliminar negocio (superadmin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
