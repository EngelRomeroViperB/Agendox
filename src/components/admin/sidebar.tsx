'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
  UserSearch,
  UserCog,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'

const ownerItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/appointments', label: 'Citas', icon: Calendar },
  { href: '/admin/staff', label: 'Staff', icon: Users },
  { href: '/admin/services', label: 'Servicios', icon: Scissors },
  { href: '/admin/employees', label: 'Empleados', icon: UserCog },
  { href: '/admin/clients', label: 'Clientes', icon: UserSearch },
  { href: '/admin/subscription', label: 'Suscripción', icon: CreditCard },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
]

const employeeItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/appointments', label: 'Citas', icon: Calendar },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { signOut, role } = useAuth()

  const items = role === 'employee' ? employeeItems : ownerItems

  return (
    <aside className="w-64 border-r min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="font-bold text-xl">Agendox</h2>
        <p className="text-xs text-muted-foreground mt-1">Panel de Administración</p>
      </div>

      <nav className="space-y-1 flex-1">
        {items.map((item) => {
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
