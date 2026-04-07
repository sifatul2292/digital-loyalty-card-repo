import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CardFlow from './CardFlow'

export default async function BusinessCardPage({ params }: { params: { businessId: string } }) {
  const supabase = createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, type, reward_threshold, reward_name')
    .eq('id', params.businessId)
    .single()

  if (!business) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <CardFlow business={business} />
    </div>
  )
}
