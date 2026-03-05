import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BusinessProvider } from '@/lib/context/business-context'
import type { BusinessContextType } from '@/lib/context/business-context'

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { businessSlug: string };
}) {
  const supabase = createAdminClient()

  // Buscar negocio por slug
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', params.businessSlug)
    .eq('is_active', true)
    .single()

  if (!business) return notFound()

  // Cargar theme, profile, staff, services y staff_services en paralelo
  const [themeRes, profileRes, staffRes, servicesRes] = await Promise.all([
    supabase.from('business_themes').select('*').eq('business_id', business.id).single(),
    supabase.from('business_profiles').select('*').eq('business_id', business.id).single(),
    supabase.from('staff').select('*').eq('business_id', business.id).eq('is_active', true),
    supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true),
  ])

  const staffIds = (staffRes.data || []).map((s: { id: string }) => s.id)
  const staffServicesRes = staffIds.length > 0
    ? await supabase.from('staff_services').select('staff_id, service_id').in('staff_id', staffIds)
    : { data: [] }

  const theme = themeRes.data || {
    id: '', business_id: business.id,
    primary_color: '#000000', secondary_color: '#ffffff',
    logo_url: null, banner_url: null, font: 'Inter',
  }
  const profile = profileRes.data || {
    id: '', business_id: business.id,
    description: null, address: null, phone: null, email: null,
    social_links: null, gallery_urls: null, working_hours: null,
    post_booking_instructions: null,
  }

  const contextValue: BusinessContextType = {
    business,
    theme,
    profile,
    staff: staffRes.data || [],
    services: servicesRes.data || [],
    staffServices: staffServicesRes.data || [],
  }

  return (
    <BusinessProvider value={contextValue}>
      <div
        className="min-h-screen"
        style={{
          '--color-primary': theme.primary_color,
          '--color-secondary': theme.secondary_color,
          fontFamily: theme.font || 'Inter',
        } as React.CSSProperties}
      >
        {children}
      </div>
    </BusinessProvider>
  );
}
