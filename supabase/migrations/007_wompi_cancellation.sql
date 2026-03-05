-- 007: Campos para Wompi y tiempo mínimo de cancelación

-- Agregar campo de tiempo mínimo de cancelación al perfil del negocio (en horas)
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS min_cancellation_hours INTEGER DEFAULT 24;

-- Agregar campo gateway_reference a subscriptions para guardar referencia de Wompi
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS gateway_reference TEXT,
  ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'wompi';
