-- ============================================
-- Agendox — Staff-Services Many-to-Many
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS staff_services (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- RLS: lectura pública (necesario para el wizard de booking)
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_staff_services" ON staff_services
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_staff_services" ON staff_services
  FOR ALL USING (true) WITH CHECK (true);

-- Agregar columnas de imagen si no existen
ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Agregar columnas de tema si no existen
ALTER TABLE business_themes ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE business_themes ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Agregar galería al perfil
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
