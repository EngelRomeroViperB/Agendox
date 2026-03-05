'use client'

import { usePathname } from 'next/navigation'
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
  const { impersonating, stopImpersonating } = useAuth()

  // La página de login no tiene sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
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
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
