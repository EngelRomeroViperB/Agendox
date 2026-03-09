'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Al cargar: si viene de logout, no auto-redirigir. Si tiene sesión válida, redirigir.
  useEffect(() => {
    const check = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get('logged_out') === '1') return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Tiene sesión activa — redirigir según rol
        if (user.app_metadata?.role === 'superadmin') {
          router.replace('/dev')
          return
        }

        const { data: bu } = await supabase
          .from('business_users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (bu?.role === 'employee') {
          router.replace('/admin/appointments')
        } else if (bu) {
          router.replace('/admin/dashboard')
        }
      } catch {
        // Si algo falla, simplemente mostrar el login
      } finally {
        setChecking(false)
      }
    }
    check()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Error al iniciar sesión', {
        description: error.message,
      })
      setLoading(false)
      return
    }

    const user = data.user

    // Verificar si es superadmin
    if (user?.app_metadata?.role === 'superadmin') {
      router.push('/dev')
      return
    }

    // Buscar en business_users para determinar rol
    const { data: businessUser, error: buError } = await supabase
      .from('business_users')
      .select('business_id, role')
      .eq('id', user?.id)
      .single()

    if (buError || !businessUser) {
      toast.error('No se encontró un negocio asociado a este usuario')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (businessUser.role === 'employee') {
      router.push('/admin/appointments')
    } else {
      router.push('/admin/dashboard')
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Agendox</CardTitle>
          <CardDescription>
            Inicia sesión para acceder a tu panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
