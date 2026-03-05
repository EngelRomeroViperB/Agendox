import { createAdminClient } from '@/lib/supabase/server'

export type SubStatus = 'active' | 'trialing' | 'expired' | 'none'

export async function checkBusinessSubscription(businessId: string): Promise<SubStatus> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('business_id', businessId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return 'none'

  if (data.status === 'trialing' || data.status === 'active') {
    const endDate = new Date(data.current_period_end)
    if (endDate < new Date()) return 'expired'
    return data.status as SubStatus
  }

  return 'expired'
}
