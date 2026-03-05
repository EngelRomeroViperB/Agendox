-- ============================================
-- Agendox — Employee-Staff Linking
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Agregar columna staff_id a business_users para vincular empleados con su perfil de staff
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- Índice para buscar business_users por staff_id
CREATE INDEX IF NOT EXISTS idx_business_users_staff ON business_users(staff_id);
