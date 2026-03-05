'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'

const navItems = [
  { href: '/dev', label: 'Dashboard Global', icon: LayoutDashboard },
  { href: '/dev/businesses', label: 'Negocios', icon: Building2 },
  { href: '/dev/businesses/new', label: 'Nuevo Negocio', icon: PlusCircle },
  { href: '/dev/subscriptions', label: 'Suscripciones', icon: CreditCard },
]

export function DevSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <aside className="w-64 border-r min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="font-bold text-xl">Agendox</h2>
        <p className="text-xs text-muted-foreground mt-1">Panel de Desarrolladores</p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  )
}
