'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile fields
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [postBookingInstructions, setPostBookingInstructions] = useState('')
  const [workingHours, setWorkingHours] = useState<Record<string, {
    is_open: boolean; open_time: string; close_time: string
  }>>({})

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        const p = data.profile || {}
        setDescription(p.description || '')
        setAddress(p.address || '')
        setPhone(p.phone || '')
        setEmail(p.email || '')
        setPostBookingInstructions(p.post_booking_instructions || '')
        const sl = p.social_links || {}
        setInstagram(sl.instagram || '')
        setWhatsapp(sl.whatsapp || '')
        setFacebook(sl.facebook || '')
        setTiktok(sl.tiktok || '')
        setWorkingHours(p.working_hours || DAYS.reduce((acc, d) => ({
          ...acc, [d.key]: { is_open: d.key !== 'domingo', open_time: '09:00', close_time: '18:00' }
        }), {}))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const updateDay = (key: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          description, address, phone, email,
          social_links: { instagram, whatsapp, facebook, tiktok },
          working_hours: workingHours,
          post_booking_instructions: postBookingInstructions,
        },
      }),
    })
    if (res.ok) toast.success('Configuración guardada')
    else toast.error('Error al guardar')
    setSaving(false)
  }

  if (loading) return <p className="text-muted-foreground">Cargando configuración...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configuración del Negocio</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="horario">Horario</TabsTrigger>
          <TabsTrigger value="redes">Redes Sociales</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información del Portal</CardTitle>
              <CardDescription>Datos visibles en el portal público</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Descripción del negocio..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle 123 #45-67" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+57 300 123 4567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Correo de contacto</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@negocio.com" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Instrucciones post-reserva</Label>
                <Textarea value={postBookingInstructions} onChange={e => setPostBookingInstructions(e.target.value)} rows={3} placeholder="Llega 5 minutos antes..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horario">
          <Card>
            <CardHeader>
              <CardTitle>Horario de Atención</CardTitle>
              <CardDescription>Configura los días y horas de atención del negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map(day => (
                <div key={day.key} className="flex items-center gap-4 py-2">
                  <span className="w-24 text-sm font-medium">{day.label}</span>
                  <Switch
                    checked={workingHours[day.key]?.is_open ?? false}
                    onCheckedChange={v => updateDay(day.key, 'is_open', v)}
                  />
                  {workingHours[day.key]?.is_open ? (
                    <>
                      <Input type="time" value={workingHours[day.key]?.open_time || '09:00'} onChange={e => updateDay(day.key, 'open_time', e.target.value)} className="w-32" />
                      <span className="text-muted-foreground">a</span>
                      <Input type="time" value={workingHours[day.key]?.close_time || '18:00'} onChange={e => updateDay(day.key, 'close_time', e.target.value)} className="w-32" />
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redes">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>Enlaces a redes sociales visibles en el portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Instagram</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@negocio" /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+57 300 123 4567" /></div>
                <div className="space-y-2"><Label>Facebook</Label><Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/negocio" /></div>
                <div className="space-y-2"><Label>TikTok</Label><Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@negocio" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
