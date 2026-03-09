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
  impersonating?: { id: string; name: string; slug: string } | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    businessId: null,
    staffId: null,
    loading: true,
    impersonating: null,
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
        // Check impersonation
        try {
          const impRes = await fetch('/api/dev/impersonate')
          const impData = await impRes.json()
          if (impData.impersonating && impData.business) {
            setAuthState({
              user, role: 'owner', businessId: impData.business.id,
              staffId: null, loading: false,
              impersonating: impData.business,
            })
            return
          }
        } catch {}
        setAuthState({ user, role: 'superadmin', businessId: null, staffId: null, loading: false, impersonating: null })
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
        try {
          const impRes = await fetch('/api/dev/impersonate')
          const impData = await impRes.json()
          if (impData.impersonating && impData.business) {
            setAuthState({
              user, role: 'owner', businessId: impData.business.id,
              staffId: null, loading: false,
              impersonating: impData.business,
            })
            return
          }
        } catch {}
        setAuthState({ user, role: 'superadmin', businessId: null, staffId: null, loading: false, impersonating: null })
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
          impersonating: null,
        })
      } else {
        setAuthState({ user, role: null, businessId: null, staffId: null, loading: false, impersonating: null })
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    // Clear impersonation if active
    if (authState.impersonating) {
      await fetch('/api/dev/impersonate', { method: 'DELETE' })
      setAuthState({ user: authState.user, role: 'superadmin', businessId: null, staffId: null, loading: false, impersonating: null })
      window.location.href = '/dev'
      return
    }
    // Usar endpoint server-side para limpiar cookies correctamente
    await fetch('/api/auth/signout', { method: 'POST' })
    await supabase.auth.signOut({ scope: 'global' })
    setAuthState({ user: null, role: null, businessId: null, staffId: null, loading: false, impersonating: null })
    // Force full page reload to clear all cached state
    window.location.href = '/admin/login?logged_out=1'
  }

  const stopImpersonating = async () => {
    await fetch('/api/dev/impersonate', { method: 'DELETE' })
    window.location.href = '/dev'
  }

  return { ...authState, signOut, stopImpersonating }
}
