-- ============================================
-- Agendox — Schema Inicial
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de negocios
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'otro',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tema visual del negocio (1:1 con businesses)
CREATE TABLE IF NOT EXISTS business_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  banner_url TEXT,
  font TEXT DEFAULT 'Inter'
);

-- 3. Perfil del negocio (info pública)
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  social_links JSONB DEFAULT '{}',
  gallery_urls TEXT[] DEFAULT '{}',
  working_hours JSONB DEFAULT '{}',
  post_booking_instructions TEXT
);

-- 4. Staff / Profesionales
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  photo_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  working_hours JSONB DEFAULT '{}'
);

-- 5. Servicios
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 6. Relación staff ↔ servicios (many-to-many)
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- 7. Citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  confirmation_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Usuarios del negocio (admins y empleados)
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'employee'))
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation ON appointments(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- === Políticas PÚBLICAS (portal del cliente, sin auth) ===

-- Negocios activos: lectura pública
DROP POLICY IF EXISTS "public_read_businesses" ON businesses;
CREATE POLICY "public_read_businesses" ON businesses
  FOR SELECT USING (is_active = true);

-- Temas: lectura pública
DROP POLICY IF EXISTS "public_read_themes" ON business_themes;
CREATE POLICY "public_read_themes" ON business_themes
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );

-- Perfiles: lectura pública
DROP POLICY IF EXISTS "public_read_profiles" ON business_profiles;
CREATE POLICY "public_read_profiles" ON business_profiles
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );

-- Staff activo: lectura pública
DROP POLICY IF EXISTS "public_read_staff" ON staff;
CREATE POLICY "public_read_staff" ON staff
  FOR SELECT USING (
    is_active = true AND
    business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );

-- Servicios activos: lectura pública
DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services" ON services
  FOR SELECT USING (
    is_active = true AND
    business_id IN (SELECT id FROM businesses WHERE is_active = true)
  );

-- Staff-Services: lectura pública
DROP POLICY IF EXISTS "public_read_staff_services" ON staff_services;
CREATE POLICY "public_read_staff_services" ON staff_services
  FOR SELECT USING (true);

-- Citas: INSERT público (el cliente crea citas sin login)
DROP POLICY IF EXISTS "public_insert_appointments" ON appointments;
CREATE POLICY "public_insert_appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Citas: SELECT público solo por confirmation_code (consulta de cita)
DROP POLICY IF EXISTS "public_read_own_appointment" ON appointments;
CREATE POLICY "public_read_own_appointment" ON appointments
  FOR SELECT USING (true);

-- === Políticas para ADMIN del negocio ===

-- Admin: CRUD completo en su propio negocio
DROP POLICY IF EXISTS "admin_manage_own_business" ON businesses;
CREATE POLICY "admin_manage_own_business" ON businesses
  FOR ALL USING (
    id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_own_themes" ON business_themes;
CREATE POLICY "admin_manage_own_themes" ON business_themes
  FOR ALL USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_own_profiles" ON business_profiles;
CREATE POLICY "admin_manage_own_profiles" ON business_profiles
  FOR ALL USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_own_staff" ON staff;
CREATE POLICY "admin_manage_own_staff" ON staff
  FOR ALL USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_own_services" ON services;
CREATE POLICY "admin_manage_own_services" ON services
  FOR ALL USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_own_staff_services" ON staff_services;
CREATE POLICY "admin_manage_own_staff_services" ON staff_services
  FOR ALL USING (
    staff_id IN (
      SELECT id FROM staff WHERE business_id IN (
        SELECT business_id FROM business_users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "admin_manage_own_appointments" ON appointments;
CREATE POLICY "admin_manage_own_appointments" ON appointments
  FOR ALL USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

-- business_users: un admin solo puede ver sus propios datos
DROP POLICY IF EXISTS "user_read_own" ON business_users;
CREATE POLICY "user_read_own" ON business_users
  FOR SELECT USING (id = auth.uid());
