'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, TrendingUp, Users, Scissors, BarChart3 } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MonthlySummary {
  month: string
  label: string
  total: number
  completed: number
  cancelled: number
  pending: number
  revenue: number
}

interface StaffReport {
  id: string
  name: string
  total: number
  completed: number
  revenue: number
}

interface ServiceReport {
  id: string
  name: string
  total: number
  completed: number
  revenue: number
}

export default function AdminReports() {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [staffReport, setStaffReport] = useState<StaffReport[]>([])
  const [serviceReport, setServiceReport] = useState<ServiceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6')

  useEffect(() => {
    setLoading(true)
    const now = new Date()
    const from = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd'T'HH:mm:ss")
    const to = format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59")

    Promise.all([
      fetch(`/api/admin/reports?type=summary&months=${period}`).then(r => r.json()),
      fetch(`/api/admin/reports?type=staff&from=${from}&to=${to}`).then(r => r.json()),
      fetch(`/api/admin/reports?type=services&from=${from}&to=${to}`).then(r => r.json()),
    ])
      .then(([summaryData, staffData, serviceData]) => {
        setSummaries(summaryData.summaries || [])
        setStaffReport(staffData.staff || [])
        setServiceReport(serviceData.services || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  const handleExportCSV = () => {
    const now = new Date()
    const from = startOfMonth(subMonths(now, parseInt(period) - 1)).toISOString()
    const to = endOfMonth(now).toISOString()
    window.open(`/api/admin/reports?type=csv&from=${from}&to=${to}`, '_blank')
  }

  // Totals
  const totalRevenue = summaries.reduce((s, m) => s + m.revenue, 0)
  const totalAppts = summaries.reduce((s, m) => s + m.total, 0)
  const totalCompleted = summaries.reduce((s, m) => s + m.completed, 0)
  const maxRevenue = Math.max(...summaries.map(m => m.revenue), 1)

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Cargando reportes...</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground text-sm mt-1">Analiza el rendimiento de tu negocio</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString('es-CO')}</p>
            <p className="text-xs text-muted-foreground">últimos {period} meses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total citas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAppts}</p>
            <p className="text-xs text-muted-foreground">{totalCompleted} completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de completación</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalAppts > 0 ? Math.round((totalCompleted / totalAppts) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">citas completadas vs total</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart (bar chart with CSS) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          {summaries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Sin datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {summaries.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-20 text-right shrink-0">{m.label}</span>
                  <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-primary rounded-md transition-all duration-500"
                      style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                      ${m.revenue.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {m.total} citas
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rendimiento por profesional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffReport.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {staffReport.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.completed}/{s.total} completadas</p>
                    </div>
                    <span className="font-bold text-sm">${s.revenue.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service popularity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Servicios más populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceReport.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {serviceReport.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-7 h-7 rounded-full flex items-center justify-center p-0 text-xs">
                        {i + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.total} reservas</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm">${s.revenue.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
