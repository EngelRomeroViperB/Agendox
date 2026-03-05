-- ============================================
-- Agendox — Subscriptions Schema
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Planes de suscripción disponibles
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_staff INTEGER NOT NULL DEFAULT 1,
  max_services INTEGER NOT NULL DEFAULT 5,
  max_appointments_month INTEGER NOT NULL DEFAULT 50,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Suscripciones de cada negocio
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  bold_subscription_id TEXT,
  bold_customer_id TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de pagos
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  bold_payment_id TEXT,
  payment_method TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_business ON payment_history(business_id);

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Planes: lectura pública
CREATE POLICY "public_read_plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Suscripciones: solo admin de su negocio
CREATE POLICY "admin_read_own_subscription" ON subscriptions
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

-- Pagos: solo admin de su negocio
CREATE POLICY "admin_read_own_payments" ON payment_history
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM business_users WHERE id = auth.uid())
  );

-- Superadmin: acceso total (via service_role_key, bypasses RLS)

-- Insertar planes por defecto
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_staff, max_services, max_appointments_month, features, sort_order) VALUES
  ('Gratis', 'free', 'Ideal para probar la plataforma', 0, 0, 1, 3, 20, '["Hasta 1 profesional", "3 servicios", "20 citas/mes", "Portal público"]', 0),
  ('Básico', 'basic', 'Para negocios pequeños', 49900, 479000, 3, 10, 200, '["Hasta 3 profesionales", "10 servicios", "200 citas/mes", "Portal personalizado", "Notificaciones email"]', 1),
  ('Pro', 'pro', 'Para negocios en crecimiento', 99900, 959000, 10, 50, 1000, '["Hasta 10 profesionales", "50 servicios", "1000 citas/mes", "Todo de Básico", "Reportes avanzados", "Soporte prioritario"]', 2),
  ('Enterprise', 'enterprise', 'Solución completa sin límites', 199900, 1919000, 999, 999, 99999, '["Profesionales ilimitados", "Servicios ilimitados", "Citas ilimitadas", "Todo de Pro", "API access", "Soporte dedicado"]', 3)
ON CONFLICT (slug) DO NOTHING;
