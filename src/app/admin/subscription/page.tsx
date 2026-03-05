'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Users, Scissors, CalendarCheck, Crown, AlertTriangle, Loader2, ExternalLink, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Plan {
  id: string
  name: string
  slug: string
  description: string
  price_monthly: number
  price_yearly: number
  max_staff: number
  max_services: number
  max_appointments_month: number
  features: string[]
}

interface Subscription {
  id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  trial_ends_at: string | null
  subscription_plans: Plan
}

interface Usage {
  staff: number
  services: number
  appointments_this_month: number
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Periodo de prueba',
  active: 'Activa',
  past_due: 'Pago pendiente',
  cancelled: 'Cancelada',
  expired: 'Expirada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  trialing: 'outline',
  active: 'default',
  past_due: 'destructive',
  cancelled: 'destructive',
  expired: 'secondary',
}

export default function AdminSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [usage, setUsage] = useState<Usage>({ staff: 0, services: 0, appointments_this_month: 0 })
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showPlans, setShowPlans] = useState(false)

  useEffect(() => {
    fetch('/api/admin/subscription')
      .then(r => r.json())
      .then(data => {
        setSubscription(data.subscription || null)
        setUsage(data.usage || { staff: 0, services: 0, appointments_this_month: 0 })
        if (data.plans) setPlans(data.plans)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handlePay = async (planId: string, cycle: string) => {
    setPaying(true)
    try {
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, billing_cycle: cycle }),
      })
      const data = await res.json()
      if (res.ok && data.payment_url) {
        window.location.href = data.payment_url
      } else {
        toast.error(data.error || 'Error al crear enlace de pago')
      }
    } catch {
      toast.error('Error al procesar pago')
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de cancelar tu suscripción? Tu plan seguirá activo hasta el final del periodo actual.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/admin/subscription/cancel', { method: 'POST' })
      if (res.ok) {
        toast.success('Suscripción cancelada. Seguirá activa hasta el fin del periodo.')
        setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null)
      } else {
        toast.error('Error al cancelar')
      }
    } catch {
      toast.error('Error al cancelar')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Cargando...</p></div>
  }

  const plan = subscription?.subscription_plans
  const isExpired = subscription?.status === 'expired' || subscription?.status === 'cancelled'
  const isPastDue = subscription?.status === 'past_due'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu plan y facturación</p>
      </div>

      {!subscription ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
            <h3 className="font-bold text-lg mb-1">Sin suscripción activa</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Elige un plan para comenzar a usar la plataforma.
            </p>
            {plans.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-4">
                {plans.map(p => (
                  <div key={p.id} className="border rounded-xl p-5 space-y-3 bg-white">
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <div className="text-2xl font-bold">
                      ${Number(p.price_monthly).toLocaleString('es-CO')}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    {p.features?.map((f, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </p>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" onClick={() => handlePay(p.id, 'monthly')} disabled={paying}>
                        {paying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mensual'}
                      </Button>
                      {Number(p.price_yearly) > 0 && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePay(p.id, 'yearly')} disabled={paying}>
                          Anual
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Plan actual */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <div>
                  <CardTitle className="text-lg">Plan {plan?.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan?.description}</p>
                </div>
              </div>
              <Badge variant={STATUS_VARIANTS[subscription.status] || 'outline'}>
                {STATUS_LABELS[subscription.status] || subscription.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Ciclo</span>
                  <span className="font-medium">{subscription.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Precio</span>
                  <span className="font-medium">
                    ${Number(subscription.billing_cycle === 'yearly' ? plan?.price_yearly : plan?.price_monthly).toLocaleString('es-CO')}/
                    {subscription.billing_cycle === 'yearly' ? 'año' : 'mes'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Periodo actual</span>
                  <span className="font-medium">
                    {format(new Date(subscription.current_period_start), 'd MMM', { locale: es })} — {format(new Date(subscription.current_period_end), 'd MMM yyyy', { locale: es })}
                  </span>
                </div>
                {subscription.trial_ends_at && subscription.status === 'trialing' && (
                  <div>
                    <span className="text-muted-foreground block">Prueba termina</span>
                    <span className="font-medium">
                      {format(new Date(subscription.trial_ends_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}
              </div>

              {(isExpired || isPastDue) && (
                <div className="flex items-start gap-2 text-sm bg-destructive/10 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>
                    {isPastDue
                      ? 'Tu pago está pendiente. Actualiza tu método de pago para evitar la suspensión.'
                      : 'Tu suscripción ha expirado. Renueva para seguir usando la plataforma.'}
                  </span>
                </div>
              )}

              {/* Acciones */}
              <Separator />
              <div className="flex gap-2 flex-wrap">
                {(isExpired || isPastDue) && plan && (
                  <Button
                    onClick={() => handlePay(plan.id, subscription.billing_cycle)}
                    disabled={paying}
                  >
                    {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    {paying ? 'Procesando...' : 'Renovar plan'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowPlans(!showPlans)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Cambiar plan
                </Button>
                {subscription.status !== 'cancelled' && subscription.status !== 'expired' && (
                  <Button variant="ghost" className="text-destructive" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Cancelar suscripción
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Planes disponibles */}
          {showPlans && plans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Planes disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map(p => (
                    <div key={p.id} className={`border rounded-xl p-5 space-y-3 ${
                      plan?.id === p.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                      <div className="text-2xl font-bold">
                        ${Number(p.price_monthly).toLocaleString('es-CO')}
                        <span className="text-sm font-normal text-muted-foreground">/mes</span>
                      </div>
                      {p.features?.map((f, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-green-500">✓</span> {f}
                        </p>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" onClick={() => handlePay(p.id, 'monthly')} disabled={paying}>
                          Mensual
                        </Button>
                        {Number(p.price_yearly) > 0 && (
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePay(p.id, 'yearly')} disabled={paying}>
                            Anual
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Uso actual */}
          {plan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uso actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Profesionales
                    </span>
                    <span className="font-medium">{usage.staff} / {plan.max_staff}</span>
                  </div>
                  <Progress value={(usage.staff / plan.max_staff) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      Servicios
                    </span>
                    <span className="font-medium">{usage.services} / {plan.max_services}</span>
                  </div>
                  <Progress value={(usage.services / plan.max_services) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      Citas este mes
                    </span>
                    <span className="font-medium">{usage.appointments_this_month} / {plan.max_appointments_month}</span>
                  </div>
                  <Progress value={(usage.appointments_this_month / plan.max_appointments_month) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {plan?.features && plan.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Características del plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
