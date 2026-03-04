'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Pencil, Eye, Power } from 'lucide-react'
import { toast } from 'sonner'

interface Business {
  id: string
  name: string
  slug: string
  business_type: string
  is_active: boolean
  created_at: string
  appointments: { count: number }[]
}

const BUSINESS_TYPES = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'barberia', label: 'Barbería' },
  { value: 'estetica_canina', label: 'Estética Canina' },
  { value: 'salon_belleza', label: 'Salón de Belleza' },
  { value: 'spa', label: 'Spa' },
  { value: 'consultorio', label: 'Consultorio' },
  { value: 'otro', label: 'Otro' },
]

export default function DevBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchBusinesses = () => {
    setLoading(true)
    fetch('/api/businesses')
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchBusinesses() }, [])

  const toggleActive = async (id: string, currentActive: boolean) => {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    })
    if (res.ok) {
      toast.success(currentActive ? 'Negocio desactivado' : 'Negocio activado')
      fetchBusinesses()
    } else {
      toast.error('Error al cambiar estado')
    }
  }

  const filtered = businesses.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && b.business_type !== typeFilter) return false
    if (statusFilter === 'active' && !b.is_active) return false
    if (statusFilter === 'inactive' && b.is_active) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Negocios</h1>
        <Link href="/dev/businesses/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Negocio
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} negocio{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No se encontraron negocios
            </p>
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
                {filtered.map((biz) => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-medium">{biz.name}</TableCell>
                    <TableCell>{biz.business_type}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">/{biz.slug}</TableCell>
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
                          <Button variant="ghost" size="icon" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/${biz.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" title="Ver portal">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={biz.is_active ? 'Desactivar' : 'Activar'}
                          onClick={() => toggleActive(biz.id, biz.is_active)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
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
