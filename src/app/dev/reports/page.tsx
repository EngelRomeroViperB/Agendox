'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, CalendarCheck, TrendingUp, CreditCard } from 'lucide-react'

interface BusinessReport {
  id: string
  name: string
  slug: string
  is_active: boolean
  appointments: { count: number }[]
  staff: { count: number }[]
  services: { count: number }[]
}

interface SubSummary {
  active: number
  trialing: number
  expired: number
  total: number
}

export default function DevReports() {
  const [businesses, setBusinesses] = useState<BusinessReport[]>([])
  const [subSummary, setSubSummary] = useState<SubSummary>({ active: 0, trialing: 0, expired: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/businesses').then(r => r.json()),
      fetch('/api/dev/subscriptions?type=subscriptions').then(r => r.json()),
    ])
      .then(([bizData, subsData]) => {
        setBusinesses(Array.isArray(bizData) ? bizData : [])
        const subs = Array.isArray(subsData) ? subsData : []
        setSubSummary({
          active: subs.filter((s: { status: string }) => s.status === 'active').length,
          trialing: subs.filter((s: { status: string }) => s.status === 'trialing').length,
          expired: subs.filter((s: { status: string }) => ['expired', 'cancelled', 'past_due'].includes(s.status)).length,
          total: subs.length,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalAppts = businesses.reduce((acc, b) => acc + (b.appointments?.[0]?.count || 0), 0)
  const totalStaff = businesses.reduce((acc, b) => acc + (b.staff?.[0]?.count || 0), 0)
  const activeBusinesses = businesses.filter(b => b.is_active).length

  // Sort by appointments (most active first)
  const sorted = [...businesses].sort((a, b) =>
    (b.appointments?.[0]?.count || 0) - (a.appointments?.[0]?.count || 0)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes Globales</h1>
        <p className="text-muted-foreground text-sm mt-1">Métricas de toda la plataforma</p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negocios Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeBusinesses}</p>
            <p className="text-xs text-muted-foreground">{businesses.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Citas Totales</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAppts}</p>
            <p className="text-xs text-muted-foreground">en toda la plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profesionales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStaff}</p>
            <p className="text-xs text-muted-foreground">registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suscripciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subSummary.active}</p>
            <p className="text-xs text-muted-foreground">
              {subSummary.trialing} prueba · {subSummary.expired} vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suscripciones por estado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suscripciones por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Activas: <strong>{subSummary.active}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400" />
              <span>Prueba: <strong>{subSummary.trialing}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span>Vencidas/Cancel: <strong>{subSummary.expired}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking de negocios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negocios más activos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Citas</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((biz, idx) => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{biz.name}</p>
                        <p className="text-xs text-muted-foreground">/{biz.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{biz.appointments?.[0]?.count || 0}</TableCell>
                    <TableCell>{biz.staff?.[0]?.count || 0}</TableCell>
                    <TableCell>{biz.services?.[0]?.count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={biz.is_active ? 'default' : 'secondary'}>
                        {biz.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
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
