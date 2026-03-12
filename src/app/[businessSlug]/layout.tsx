import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BusinessProvider } from '@/lib/context/business-context'
import type { BusinessContextType } from '@/lib/context/business-context'
import { checkBusinessSubscription } from '@/lib/subscription-check'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700'],
  display: 'swap',
})

export const dynamic = 'force-dynamic'

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

  // Check subscription status
  const subStatus = await checkBusinessSubscription(business.id)
  if (subStatus === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Portal no disponible</h1>
          <p className="text-muted-foreground text-sm">Este negocio no está disponible temporalmente. Por favor, intenta de nuevo más tarde.</p>
        </div>
      </div>
    )
  }

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
        className={`min-h-screen ${playfair.variable}`}
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
