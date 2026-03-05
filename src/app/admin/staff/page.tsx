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
import { ImageUpload } from '@/components/ui/image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/hooks/use-auth'

interface ServiceOption {
  id: string
  name: string
}

interface StaffServiceLink {
  staff_id: string
  service_id: string
}

interface StaffMember {
  id: string
  name: string
  role: string
  bio: string | null
  photo_url: string | null
  is_active: boolean
}

export default function AdminStaff() {
  const { businessId } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [allServices, setAllServices] = useState<ServiceOption[]>([])
  const [staffServices, setStaffServices] = useState<StaffServiceLink[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  const fetchStaff = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/staff')
      .then(r => r.json())
      .then(data => { setStaff(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fetchServices = useCallback(() => {
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(data => setAllServices(Array.isArray(data) ? data : []))
  }, [])

  const fetchStaffServices = useCallback(() => {
    fetch('/api/admin/staff-services')
      .then(r => r.json())
      .then(data => setStaffServices(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => { fetchStaff(); fetchServices(); fetchStaffServices() }, [fetchStaff, fetchServices, fetchStaffServices])

  const resetForm = () => { setName(''); setRole(''); setBio(''); setPhotoUrl(null); setSelectedServiceIds([]); setEditingId(null) }

  const openCreate = () => { resetForm(); setDialogOpen(true) }

  const openEdit = (member: StaffMember) => {
    setEditingId(member.id); setName(member.name); setRole(member.role); setBio(member.bio || ''); setPhotoUrl(member.photo_url)
    setSelectedServiceIds(staffServices.filter(ss => ss.staff_id === member.id).map(ss => ss.service_id))
    setDialogOpen(true)
  }

  const toggleServiceId = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  const handleSave = async () => {
    if (!name) { toast.error('El nombre es requerido'); return }

    if (editingId) {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, name, role, bio, photo_url: photoUrl }),
      })
      if (res.ok) {
        // Guardar servicios asignados
        if (selectedServiceIds.length > 0) {
          await fetch('/api/admin/staff-services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: editingId, service_ids: selectedServiceIds }),
          })
        } else {
          await fetch(`/api/admin/staff-services?staff_id=${editingId}`, { method: 'DELETE' })
        }
        toast.success('Profesional actualizado'); fetchStaff(); fetchStaffServices()
      } else toast.error('Error al actualizar')
    } else {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, bio, photo_url: photoUrl }),
      })
      if (res.ok) {
        const created = await res.json()
        // Guardar servicios asignados al nuevo staff
        if (selectedServiceIds.length > 0 && created?.id) {
          await fetch('/api/admin/staff-services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: created.id, service_ids: selectedServiceIds }),
          })
        }
        toast.success('Profesional creado'); fetchStaff(); fetchStaffServices()
      } else toast.error('Error al crear')
    }
    setDialogOpen(false); resetForm()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (res.ok) fetchStaff()
    else toast.error('Error al cambiar estado')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este profesional?')) return
    const res = await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Profesional eliminado'); fetchStaff() }
    else toast.error('Error al eliminar')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Staff</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nuevo Profesional</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Profesional' : 'Nuevo Profesional'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label>Cargo / Rol</Label>
                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Barbero Senior" />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Breve descripción..." />
              </div>
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <ImageUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  folder="staff-photos"
                  businessId={businessId || undefined}
                  aspectRatio="square"
                  placeholder="Subir foto"
                />
              </div>
              {allServices.length > 0 && (
                <div className="space-y-2">
                  <Label>Servicios que ofrece</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {allServices.map(svc => (
                      <label key={svc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selectedServiceIds.includes(svc.id)}
                          onCheckedChange={() => toggleServiceId(svc.id)}
                        />
                        {svc.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={handleSave}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>{staff.length} profesional{staff.length !== 1 ? 'es' : ''}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : staff.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay profesionales registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {m.photo_url ? (
                          <img src={m.photo_url} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {m.name.charAt(0)}
                          </div>
                        )}
                        {m.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.role || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staffServices
                          .filter(ss => ss.staff_id === m.id)
                          .map(ss => {
                            const svc = allServices.find(s => s.id === ss.service_id)
                            return svc ? (
                              <Badge key={ss.service_id} variant="outline" className="text-xs">{svc.name}</Badge>
                            ) : null
                          })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? 'default' : 'secondary'}>
                        {m.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={m.is_active} onCheckedChange={() => toggleActive(m.id, m.is_active)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
