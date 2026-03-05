-- 006: Campos para notificaciones y recordatorios

-- Agregar campos de notificación al perfil del negocio
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"booking_confirmation":true,"cancellation":true,"reminder":true,"admin_new_booking":true}';

-- Agregar campo reminded_at a appointments para evitar enviar recordatorios duplicados
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;
