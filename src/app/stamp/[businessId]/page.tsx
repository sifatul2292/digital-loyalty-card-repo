import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import StaffFlow from './StaffFlow'

export default async function StaffPage({
  params,
}: {
  params: { businessId: string }
}) {
  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, type, reward_threshold, reward_name')
    .eq('id', params.businessId)
    .single()

  if (!business) notFound()

  return <StaffFlow business={business} />
}
