import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBusinessContext } from '@/lib/auth/get-business-id'

// GET: Obtener perfil y configuración del negocio
export async function GET() {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  const businessId = ctx.businessId

  const admin = createAdminClient()
  const [bizRes, profileRes, themeRes] = await Promise.all([
    admin.from('businesses').select('*').eq('id', businessId).single(),
    admin.from('business_profiles').select('*').eq('business_id', businessId).single(),
    admin.from('business_themes').select('*').eq('business_id', businessId).single(),
  ])

  return NextResponse.json({
    business: bizRes.data,
    profile: profileRes.data,
    theme: themeRes.data,
  })
}

// PATCH: Actualizar configuración
export async function PATCH(request: Request) {
  const ctx = await getBusinessContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado o sin negocio' }, { status: 401 })
  const businessId = ctx.businessId

  const body = await request.json()
  const { profile, theme } = body
  const admin = createAdminClient()

  if (profile) {
    // Separar campos base de campos opcionales (migraciones 006-007)
    const { notification_email, notification_settings, min_cancellation_hours, ...baseProfile } = profile

    // Primero guardar campos base
    const { error: baseError } = await admin
      .from('business_profiles')
      .update(baseProfile)
      .eq('business_id', businessId)
    if (baseError) return NextResponse.json({ error: baseError.message }, { status: 400 })

    // Intentar guardar campos opcionales (pueden no existir si migraciones no se han ejecutado)
    const optionalFields: Record<string, unknown> = {}
    if (notification_email !== undefined) optionalFields.notification_email = notification_email
    if (notification_settings !== undefined) optionalFields.notification_settings = notification_settings
    if (min_cancellation_hours !== undefined) optionalFields.min_cancellation_hours = min_cancellation_hours

    if (Object.keys(optionalFields).length > 0) {
      try {
        await admin
          .from('business_profiles')
          .update(optionalFields)
          .eq('business_id', businessId)
      } catch {
        console.log('[Settings] Optional fields not saved (migrations may not be applied yet)')
      }
    }
  }

  if (theme) {
    const { error } = await admin
      .from('business_themes')
      .update(theme)
      .eq('business_id', businessId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
