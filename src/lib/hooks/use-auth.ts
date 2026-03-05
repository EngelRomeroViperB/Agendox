'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

interface AuthState {
  user: User | null
  role: UserRole | 'superadmin' | null
  businessId: string | null
  staffId: string | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    businessId: null,
    staffId: null,
    loading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        setAuthState({ user: null, role: null, businessId: null, staffId: null, loading: false })
        return
      }

      const user = session.user

      // Verificar si es superadmin
      if (user.app_metadata?.role === 'superadmin') {
        setAuthState({ user, role: 'superadmin', businessId: null, staffId: null, loading: false })
        return
      }

      // Buscar en business_users
      const { data: businessUser } = await supabase
        .from('business_users')
        .select('business_id, role, staff_id')
        .eq('id', user.id)
        .single()

      if (businessUser) {
        setAuthState({
          user,
          role: businessUser.role as UserRole,
          businessId: businessUser.business_id,
          staffId: businessUser.staff_id || null,
          loading: false,
        })
      } else {
        setAuthState({ user, role: null, businessId: null, staffId: null, loading: false })
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setAuthState({ user: null, role: null, businessId: null, staffId: null, loading: false })
        return
      }

      const user = session.user

      if (user.app_metadata?.role === 'superadmin') {
        setAuthState({ user, role: 'superadmin', businessId: null, staffId: null, loading: false })
        return
      }

      const { data: businessUser } = await supabase
        .from('business_users')
        .select('business_id, role, staff_id')
        .eq('id', user.id)
        .single()

      if (businessUser) {
        setAuthState({
          user,
          role: businessUser.role as UserRole,
          businessId: businessUser.business_id,
          staffId: businessUser.staff_id || null,
          loading: false,
        })
      } else {
        setAuthState({ user, role: null, businessId: null, staffId: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthState({ user: null, role: null, businessId: null, staffId: null, loading: false })
    window.location.href = '/admin/login'
  }

  return { ...authState, signOut }
}
