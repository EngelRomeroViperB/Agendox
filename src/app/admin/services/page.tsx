'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState(0)

  const fetchServices = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(data => { setServices(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  const resetForm = () => { setName(''); setDuration(30); setPrice(0); setEditingId(null) }

  const openCreate = () => { resetForm(); setDialogOpen(true) }

  const openEdit = (svc: Service) => {
    setEditingId(svc.id); setName(svc.name); setDuration(svc.duration_minutes); setPrice(svc.price)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name) { toast.error('El nombre es requerido'); return }

    if (editingId) {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, name, duration_minutes: duration, price }),
      })
      if (res.ok) { toast.success('Servicio actualizado'); fetchServices() }
      else toast.error('Error al actualizar')
    } else {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, duration_minutes: duration, price }),
      })
      if (res.ok) { toast.success('Servicio creado'); fetchServices() }
      else toast.error('Error al crear')
    }
    setDialogOpen(false); resetForm()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (res.ok) fetchServices()
    else toast.error('Error al cambiar estado')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Servicio eliminado'); fetchServices() }
    else toast.error('Error al eliminar')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Servicios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nuevo Servicio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Corte clásico" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración (min)</Label>
                  <Input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <Button className="w-full" onClick={handleSave}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>{services.length} servicio{services.length !== 1 ? 's' : ''}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay servicios registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(svc => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-medium">{svc.name}</TableCell>
                    <TableCell>{svc.duration_minutes} min</TableCell>
                    <TableCell>${Number(svc.price).toLocaleString('es-CO')}</TableCell>
                    <TableCell>
                      <Badge variant={svc.is_active ? 'default' : 'secondary'}>
                        {svc.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={svc.is_active} onCheckedChange={() => toggleActive(svc.id, svc.is_active)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(svc)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(svc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
