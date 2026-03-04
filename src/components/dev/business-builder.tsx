'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Loader2, Trash2, Plus } from 'lucide-react'

const BUSINESS_TYPES = [
  { value: 'barberia', label: 'Barbería' },
  { value: 'estetica_canina', label: 'Estética Canina' },
  { value: 'salon_belleza', label: 'Salón de Belleza' },
  { value: 'spa', label: 'Spa' },
  { value: 'consultorio', label: 'Consultorio' },
  { value: 'otro', label: 'Otro' },
]

const FONTS = [
  'Inter', 'Montserrat', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Nunito',
]

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

interface ServiceInput {
  name: string
  duration_minutes: number
  price: number
}

interface StaffInput {
  name: string
  role: string
}

interface BusinessBuilderProps {
  mode: 'create' | 'edit'
  initialData?: {
    id?: string
    name?: string
    slug?: string
    business_type?: string
    is_active?: boolean
    business_themes?: {
      primary_color?: string
      secondary_color?: string
      font?: string
      logo_url?: string
      banner_url?: string
    }
    business_profiles?: {
      description?: string
      address?: string
      phone?: string
      email?: string
      social_links?: Record<string, string>
      working_hours?: Record<string, {
        is_open: boolean
        open_time: string
        close_time: string
        break_start?: string
        break_end?: string
      }>
      post_booking_instructions?: string
    }
    staff?: { name: string; role: string }[]
    services?: { name: string; duration_minutes: number; price: number }[]
  }
}

export function BusinessBuilder({ mode, initialData }: BusinessBuilderProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Sección A — Datos del Negocio
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [businessType, setBusinessType] = useState(initialData?.business_type || '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [slugError, setSlugError] = useState('')

  // Sección B — Credenciales
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Sección C — Theme
  const [primaryColor, setPrimaryColor] = useState(initialData?.business_themes?.primary_color || '#000000')
  const [secondaryColor, setSecondaryColor] = useState(initialData?.business_themes?.secondary_color || '#ffffff')
  const [font, setFont] = useState(initialData?.business_themes?.font || 'Inter')

  // Sección D — Información del Portal
  const [description, setDescription] = useState(initialData?.business_profiles?.description || '')
  const [address, setAddress] = useState(initialData?.business_profiles?.address || '')
  const [phone, setPhone] = useState(initialData?.business_profiles?.phone || '')
  const [email, setEmail] = useState(initialData?.business_profiles?.email || '')
  const [instagram, setInstagram] = useState(initialData?.business_profiles?.social_links?.instagram || '')
  const [whatsapp, setWhatsapp] = useState(initialData?.business_profiles?.social_links?.whatsapp || '')
  const [facebook, setFacebook] = useState(initialData?.business_profiles?.social_links?.facebook || '')
  const [tiktok, setTiktok] = useState(initialData?.business_profiles?.social_links?.tiktok || '')
  const [postBookingInstructions, setPostBookingInstructions] = useState(
    initialData?.business_profiles?.post_booking_instructions || ''
  )

  // Sección E — Horario
  const [workingHours, setWorkingHours] = useState<Record<string, {
    is_open: boolean; open_time: string; close_time: string;
    break_start?: string; break_end?: string
  }>>(
    initialData?.business_profiles?.working_hours ||
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day.key]: { is_open: day.key !== 'domingo', open_time: '09:00', close_time: '18:00' },
    }), {})
  )

  // Sección F — Servicios Iniciales
  const [services, setServices] = useState<ServiceInput[]>(
    initialData?.services || []
  )
  const [newService, setNewService] = useState<ServiceInput>({ name: '', duration_minutes: 30, price: 0 })

  // Sección G — Staff Inicial
  const [staffList, setStaffList] = useState<StaffInput[]>(
    initialData?.staff || []
  )
  const [newStaff, setNewStaff] = useState<StaffInput>({ name: '', role: '' })

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    setSlug(formatted)
    if (formatted.length < 3) {
      setSlugError('El slug debe tener al menos 3 caracteres')
    } else {
      setSlugError('')
    }
  }

  const generateSlug = () => {
    const generated = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(generated)
    setSlugError('')
  }

  const addService = () => {
    if (!newService.name) return
    setServices([...services, { ...newService }])
    setNewService({ name: '', duration_minutes: 30, price: 0 })
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const addStaff = () => {
    if (!newStaff.name) return
    setStaffList([...staffList, { ...newStaff }])
    setNewStaff({ name: '', role: '' })
  }

  const removeStaff = (index: number) => {
    setStaffList(staffList.filter((_, i) => i !== index))
  }

  const updateDayHours = (dayKey: string, field: string, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }))
  }

  const handleSave = async () => {
    if (!name || !slug || !businessType) {
      toast.error('Completa los datos del negocio (nombre, slug y tipo)')
      return
    }

    setSaving(true)

    try {
      const payload = {
        name,
        slug,
        business_type: businessType,
        is_active: isActive,
        theme: {
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font,
        },
        profile: {
          description,
          address,
          phone,
          email,
          social_links: { instagram, whatsapp, facebook, tiktok },
          working_hours: workingHours,
          post_booking_instructions: postBookingInstructions,
        },
      }

      let businessId = initialData?.id

      if (mode === 'create') {
        const res = await fetch('/api/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        businessId = data.id

        // Crear servicios iniciales
        if (services.length > 0 && businessId) {
          await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: businessId, services }),
          })
        }

        // Crear staff inicial
        if (staffList.length > 0 && businessId) {
          await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_id: businessId, staff: staffList }),
          })
        }

        // Crear admin si se proporcionaron credenciales
        if (adminEmail && adminPassword && businessId) {
          const adminRes = await fetch('/api/auth/create-business-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              password: adminPassword,
              business_id: businessId,
              role: 'owner',
            }),
          })
          if (!adminRes.ok) {
            const adminData = await adminRes.json()
            toast.error('Negocio creado pero error al crear admin: ' + adminData.error)
          }
        }

        toast.success('Negocio creado exitosamente')
        router.push('/dev/businesses')
      } else {
        const res = await fetch(`/api/businesses/${businessId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        // Crear admin si se proporcionaron credenciales (también en edit)
        if (adminEmail && adminPassword && businessId) {
          const adminRes = await fetch('/api/auth/create-business-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              password: adminPassword,
              business_id: businessId,
              role: 'owner',
            }),
          })
          if (!adminRes.ok) {
            const adminData = await adminRes.json()
            toast.error('Negocio actualizado pero error al crear admin: ' + adminData.error)
          } else {
            toast.success('Admin creado exitosamente')
          }
        }

        toast.success('Negocio actualizado exitosamente')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Crear Nuevo Negocio' : `Editar: ${name}`}
        </h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <Tabs defaultValue="datos" className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="credenciales">Admin</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="horario">Horario</TabsTrigger>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Sección A — Datos del Negocio */}
        <TabsContent value="datos">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Negocio</CardTitle>
              <CardDescription>Información básica del tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del negocio</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Barbería Don Pepe"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL pública)</Label>
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="barberia-don-pepe"
                  />
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    Generar
                  </Button>
                </div>
                {slugError && <p className="text-sm text-destructive">{slugError}</p>}
                {slug && !slugError && (
                  <p className="text-sm text-muted-foreground">
                    URL: tudominio.com/{slug}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo de negocio</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Negocio activo</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección B — Credenciales del Admin */}
        <TabsContent value="credenciales">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales del Admin</CardTitle>
              <CardDescription>
                Crear un usuario administrador para este negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Correo electrónico del admin</Label>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@negocio.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña temporal</Label>
                <Input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Contraseña segura"
                />
              </div>
              {mode === 'edit' && (
                <p className="text-sm text-muted-foreground">
                  Deja los campos vacíos si no quieres crear un nuevo admin.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección C — Theme */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Identidad Visual</CardTitle>
              <CardDescription>Colores y tipografía del portal público</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color primario</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color secundario</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipografía</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Preview */}
              <Separator />
              <div>
                <Label className="mb-2 block">Vista previa</Label>
                <div
                  className="rounded-lg border p-6 space-y-2"
                  style={{
                    fontFamily: font,
                    backgroundColor: secondaryColor,
                    color: primaryColor,
                  }}
                >
                  <h3 className="text-xl font-bold">{name || 'Nombre del Negocio'}</h3>
                  <p className="text-sm opacity-70">Así se verá el portal del cliente</p>
                  <button
                    className="px-4 py-2 rounded text-sm font-medium"
                    style={{ backgroundColor: primaryColor, color: secondaryColor }}
                  >
                    Agendar mi cita
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección D — Información del Portal */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información del Portal</CardTitle>
              <CardDescription>Datos que verá el cliente en el portal público</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descripción del negocio</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Somos la mejor barbería de la ciudad..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 123 #45-67" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 123 4567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Correo de contacto</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@negocio.com" />
              </div>
              <Separator />
              <p className="text-sm font-medium">Redes Sociales</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@negocio" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+57 300 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/negocio" />
                </div>
                <div className="space-y-2">
                  <Label>TikTok</Label>
                  <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@negocio" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Instrucciones post-reserva</Label>
                <Textarea
                  value={postBookingInstructions}
                  onChange={(e) => setPostBookingInstructions(e.target.value)}
                  placeholder="Llega 5 minutos antes de tu cita..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección E — Horario */}
        <TabsContent value="horario">
          <Card>
            <CardHeader>
              <CardTitle>Horario de Atención</CardTitle>
              <CardDescription>Configura los días y horas de atención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => (
                <div key={day.key} className="flex items-center gap-4 py-2">
                  <div className="w-24">
                    <span className="text-sm font-medium">{day.label}</span>
                  </div>
                  <Switch
                    checked={workingHours[day.key]?.is_open ?? false}
                    onCheckedChange={(checked) => updateDayHours(day.key, 'is_open', checked)}
                  />
                  {workingHours[day.key]?.is_open && (
                    <>
                      <Input
                        type="time"
                        value={workingHours[day.key]?.open_time || '09:00'}
                        onChange={(e) => updateDayHours(day.key, 'open_time', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={workingHours[day.key]?.close_time || '18:00'}
                        onChange={(e) => updateDayHours(day.key, 'close_time', e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                  {!workingHours[day.key]?.is_open && (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección F — Servicios */}
        <TabsContent value="servicios">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Iniciales</CardTitle>
              <CardDescription>Agrega los servicios que ofrece el negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length > 0 && (
                <div className="space-y-2">
                  {services.map((svc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                      <span className="flex-1 font-medium text-sm">{svc.name}</span>
                      <span className="text-sm text-muted-foreground">{svc.duration_minutes} min</span>
                      <span className="text-sm font-medium">${svc.price.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeService(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-4 gap-3 items-end">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="Corte clásico"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duración (min)</Label>
                  <Input
                    type="number"
                    value={newService.duration_minutes}
                    onChange={(e) => setNewService({ ...newService, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={addService} disabled={!newService.name}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección G — Staff */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Inicial</CardTitle>
              <CardDescription>Agrega los profesionales del negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffList.length > 0 && (
                <div className="space-y-2">
                  {staffList.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                      <span className="flex-1 font-medium text-sm">{member.name}</span>
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeStaff(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Rol</Label>
                  <Input
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    placeholder="Barbero Senior"
                  />
                </div>
                <Button onClick={addStaff} disabled={!newStaff.name}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
