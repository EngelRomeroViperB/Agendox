'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, CalendarCheck, CalendarPlus, TrendingUp, Eye, Pencil } from 'lucide-react'

interface BusinessWithMeta {
  id: string
  name: string
  slug: string
  business_type: string
  is_active: boolean
  created_at: string
  appointments: { count: number }[]
}

export default function DevDashboard() {
  const [businesses, setBusinesses] = useState<BusinessWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/businesses')
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalBusinesses = businesses.filter((b) => b.is_active).length
  const totalAppointments = businesses.reduce(
    (acc, b) => acc + (b.appointments?.[0]?.count || 0),
    0
  )
  const thisMonth = businesses.filter((b) => {
    const created = new Date(b.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Global</h1>
        <Link href="/dev/businesses/new">
          <Button>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Nuevo Negocio
          </Button>
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Negocios Activos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBusinesses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Citas Totales
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAppointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Negocios Nuevos (Mes)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Negocios
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{businesses.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de negocios */}
      <Card>
        <CardHeader>
          <CardTitle>Negocios en la Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay negocios registrados aún</p>
              <Link href="/dev/businesses/new">
                <Button>Crear primer negocio</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Citas</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((biz) => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-medium">{biz.name}</TableCell>
                    <TableCell>{biz.business_type}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      /b/{biz.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={biz.is_active ? 'default' : 'secondary'}>
                        {biz.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{biz.appointments?.[0]?.count || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(biz.created_at).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/dev/businesses/${biz.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/${biz.slug}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
