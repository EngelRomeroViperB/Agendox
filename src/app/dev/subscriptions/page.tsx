'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Crown, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Plan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  max_staff: number
  max_services: number
  max_appointments_month: number
}

interface Subscription {
  id: string
  business_id: string
  plan_id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  subscription_plans: { name: string; slug: string } | null
  businesses: { name: string; slug: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Prueba',
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

export default function DevSubscriptions() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [businesses, setBusinesses] = useState<{ id: string; name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [subStatus, setSubStatus] = useState('active')

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/dev/subscriptions?type=plans').then(r => r.json()),
      fetch('/api/dev/subscriptions?type=subscriptions').then(r => r.json()),
      fetch('/api/businesses').then(r => r.json()),
    ])
      .then(([plansData, subsData, bizData]) => {
        setPlans(Array.isArray(plansData) ? plansData : [])
        setSubscriptions(Array.isArray(subsData) ? subsData : [])
        setBusinesses(Array.isArray(bizData) ? bizData : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAssign = async () => {
    if (!selectedBusiness || !selectedPlan) { toast.error('Selecciona negocio y plan'); return }

    const res = await fetch('/api/dev/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: selectedBusiness,
        plan_id: selectedPlan,
        billing_cycle: billingCycle,
        status: subStatus,
      }),
    })

    if (res.ok) {
      toast.success('Suscripción asignada')
      fetchData()
      setDialogOpen(false)
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error')
    }
  }

  const handleStatusChange = async (subId: string, newStatus: string) => {
    const res = await fetch('/api/dev/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subId, status: newStatus }),
    })
    if (res.ok) {
      toast.success('Estado actualizado')
      fetchData()
    } else {
      toast.error('Error al actualizar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suscripciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona planes y suscripciones de negocios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Asignar Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar suscripción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Negocio</Label>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar negocio" /></SelectTrigger>
                  <SelectContent>
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} (/{b.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ${Number(p.price_monthly).toLocaleString('es-CO')}/mes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciclo</Label>
                  <Select value={billingCycle} onValueChange={setBillingCycle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={subStatus} onValueChange={setSubStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="trialing">Prueba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleAssign}>Asignar Suscripción</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Planes disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {plans.map(p => (
              <div key={p.id} className="border rounded-lg p-4 space-y-1">
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">${Number(p.price_monthly).toLocaleString('es-CO')}/mes</p>
                <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                  <div>{p.max_staff} profesionales</div>
                  <div>{p.max_services} servicios</div>
                  <div>{p.max_appointments_month} citas/mes</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Suscripciones activas ({subscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay suscripciones</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.businesses?.name || '—'}</TableCell>
                    <TableCell>{sub.subscription_plans?.name || '—'}</TableCell>
                    <TableCell className="text-sm">{sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[sub.status] || 'outline'}>
                        {STATUS_LABELS[sub.status] || sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sub.current_period_start), 'd MMM', { locale: es })} — {format(new Date(sub.current_period_end), 'd MMM yy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={sub.status}
                        onValueChange={(val) => handleStatusChange(sub.id, val)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="trialing">Prueba</SelectItem>
                          <SelectItem value="past_due">Pago pendiente</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="expired">Expirada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
