import { z } from 'zod'

export const businessDataSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  business_type: z.string().min(1, 'Selecciona un tipo de negocio'),
  is_active: z.boolean().default(true),
})

export const adminCredentialsSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const themeSchema = z.object({
  primary_color: z.string().default('#000000'),
  secondary_color: z.string().default('#ffffff'),
  logo_url: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  font: z.string().default('Inter'),
})

export const profileSchema = z.object({
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Correo inválido'), z.literal('')]).optional(),
  social_links: z.object({
    instagram: z.string().optional(),
    whatsapp: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
  }).default({}),
  gallery_urls: z.array(z.string()).default([]),
  post_booking_instructions: z.string().optional(),
})

export const workingHoursSchema = z.record(
  z.string(),
  z.object({
    is_open: z.boolean(),
    open_time: z.string(),
    close_time: z.string(),
    break_start: z.string().optional(),
    break_end: z.string().optional(),
  })
)

export const serviceSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  duration_minutes: z.number().min(5, 'Mínimo 5 minutos'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  is_active: z.boolean().default(true),
})

export const staffSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  role: z.string().optional(),
  bio: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type BusinessData = z.infer<typeof businessDataSchema>
export type AdminCredentials = z.infer<typeof adminCredentialsSchema>
export type ThemeData = z.infer<typeof themeSchema>
export type ProfileData = z.infer<typeof profileSchema>
export type ServiceData = z.infer<typeof serviceSchema>
export type StaffData = z.infer<typeof staffSchema>
