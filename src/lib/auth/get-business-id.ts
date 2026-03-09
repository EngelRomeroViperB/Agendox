import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface BusinessContext {
  userId: string
  businessId: string
  role: string
  staffId: string | null
}

/**
 * Obtiene el business_id del usuario autenticado.
 * Soporta impersonación: si el usuario es superadmin y tiene cookie de impersonación,
 * retorna el business_id impersonado.
 */
export async function getBusinessContext(): Promise<BusinessContext | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Si es superadmin, revisar cookie de impersonación
  if (user.app_metadata?.role === 'superadmin') {
    const cookieStore = cookies()
    const impersonatedId = cookieStore.get('x-impersonate-business')?.value
    if (impersonatedId) {
      return {
        userId: user.id,
        businessId: impersonatedId,
        role: 'owner',
        staffId: null,
      }
    }
    // Superadmin sin impersonación — no tiene business_id
    return null
  }

  // Usuario normal — buscar en business_users
  const admin = createAdminClient()
  const { data: bu } = await admin
    .from('business_users')
    .select('business_id, role, staff_id')
    .eq('id', user.id)
    .single()

  if (!bu) return null

  return {
    userId: user.id,
    businessId: bu.business_id,
    role: bu.role,
    staffId: bu.staff_id || null,
  }
}
