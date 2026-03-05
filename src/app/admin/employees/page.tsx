'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, UserCog, Link2 } from 'lucide-react'

interface Employee {
  id: string
  email: string
  role: string
  staff_id: string | null
}

interface StaffMember {
  id: string
  name: string
  role: string
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [staffId, setStaffId] = useState<string>('none')

  const fetchEmployees = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/employees').then(r => r.json()),
      fetch('/api/admin/staff').then(r => r.json()),
    ])
      .then(([empData, staffData]) => {
        setEmployees(Array.isArray(empData) ? empData : [])
        setStaffList(Array.isArray(staffData) ? staffData : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const resetForm = () => { setEmail(''); setPassword(''); setStaffId('none') }

  const handleCreate = async () => {
    if (!email || !password) { toast.error('Email y contraseña requeridos'); return }
    if (password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }

    const res = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        staff_id: staffId !== 'none' ? staffId : null,
      }),
    })

    if (res.ok) {
      toast.success('Empleado creado')
      fetchEmployees()
      setDialogOpen(false)
      resetForm()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al crear empleado')
    }
  }

  const handleLinkStaff = async (employeeId: string, newStaffId: string | null) => {
    const res = await fetch('/api/admin/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, staff_id: newStaffId }),
    })
    if (res.ok) {
      toast.success('Vínculo actualizado')
      fetchEmployees()
    } else {
      toast.error('Error al vincular')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este empleado? Se eliminará su cuenta de acceso.')) return
    const res = await fetch(`/api/admin/employees?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Empleado eliminado')
      fetchEmployees()
    } else {
      toast.error('Error al eliminar')
    }
  }

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return null
    return staffList.find(s => s.id === staffId)?.name || null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea cuentas de acceso para tu equipo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Nuevo Empleado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear cuenta de empleado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="empleado@correo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Vincular con profesional (opcional)</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin vincular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular</SelectItem>
                    {staffList.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}{s.role ? ` — ${s.role}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Al vincular, el empleado solo verá las citas de su profesional asignado
                </p>
              </div>
              <Button className="w-full" onClick={handleCreate}>Crear Empleado</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{employees.length} cuenta{employees.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay empleados registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Profesional vinculado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant={emp.role === 'owner' ? 'default' : 'secondary'}>
                        {emp.role === 'owner' ? 'Propietario' : 'Empleado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {emp.role === 'employee' ? (
                        <Select
                          value={emp.staff_id || 'none'}
                          onValueChange={(val) => handleLinkStaff(emp.id, val === 'none' ? null : val)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin vincular</SelectItem>
                            {staffList.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.role !== 'owner' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
