'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Phone } from 'lucide-react'

interface ClientRow {
  client_name: string
  client_email: string
  client_phone: string
  total_appointments: number
  last_visit: string
}

export default function AdminClients() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/appointments')
      .then(r => r.json())
      .then(data => {
        const appointments = data.appointments || []
        // Agrupar por email del cliente
        const map = new Map<string, ClientRow>()
        for (const apt of appointments) {
          const key = apt.client_email?.toLowerCase() || apt.client_phone
          if (!key) continue
          const existing = map.get(key)
          if (existing) {
            existing.total_appointments++
            if (apt.scheduled_at > existing.last_visit) {
              existing.last_visit = apt.scheduled_at
            }
          } else {
            map.set(key, {
              client_name: apt.client_name,
              client_email: apt.client_email,
              client_phone: apt.client_phone,
              total_appointments: 1,
              last_visit: apt.scheduled_at,
            })
          }
        }
        setClients(Array.from(map.values()).sort((a, b) => b.total_appointments - a.total_appointments))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.client_name.toLowerCase().includes(q) || c.client_email.toLowerCase().includes(q) || c.client_phone.includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Badge variant="outline" className="text-sm">
          <Users className="h-3 w-3 mr-1" /> {clients.length} clientes únicos
        </Badge>
      </div>

      <Input
        placeholder="Buscar por nombre, correo o teléfono..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No se encontraron clientes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Citas</TableHead>
                  <TableHead>Última visita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.client_name}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {c.client_email}
                        </p>
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {c.client_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.total_appointments}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.last_visit).toLocaleDateString('es-CO')}
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
