'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { impersonating, stopImpersonating } = useAuth()
  const [subExpired, setSubExpired] = useState(false)
  const [checked, setChecked] = useState(false)

  // Verificar suscripción al cargar (excepto en login y subscription)
  useEffect(() => {
    if (pathname === '/admin/login' || pathname === '/admin/subscription') {
      setChecked(true)
      return
    }
    if (impersonating) {
      setChecked(true)
      return
    }

    fetch('/api/admin/subscription')
      .then(r => r.json())
      .then(data => {
        const sub = data.subscription
        if (sub && (sub.status === 'expired' || sub.status === 'cancelled' || sub.status === 'past_due')) {
          setSubExpired(true)
        }
        setChecked(true)
      })
      .catch(() => setChecked(true))
  }, [pathname, impersonating])

  // La página de login no tiene sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Mientras se verifica la suscripción, no mostrar nada
  if (!checked) {
    return null
  }

  // Si la suscripción expiró y no estamos en /admin/subscription, redirigir
  if (subExpired && pathname !== '/admin/subscription') {
    router.replace('/admin/subscription')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {impersonating && (
        <div className="sticky top-0 z-50 bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>Viendo <strong>{impersonating.name}</strong> como superadmin</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs bg-yellow-100 border-yellow-600 hover:bg-yellow-200"
            onClick={stopImpersonating}
          >
            Salir
          </Button>
        </div>
      )}
      {subExpired && pathname === '/admin/subscription' && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>Tu suscripción ha expirado. Renueva tu plan para continuar usando la plataforma.</span>
        </div>
      )}
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
