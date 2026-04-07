import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Stamp, Gift, TrendingUp, ArrowRight, AlertCircle, Link2 } from 'lucide-react'
import CopyLinkButton from '@/components/CopyLinkButton'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No business found</h2>
        <p className="text-gray-500 mb-6">Please complete your business profile to get started.</p>
        <Link href="/dashboard/settings" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          Set up business
        </Link>
      </div>
    )
  }

  const [customersRes, stampsRes, rewardsRes, recentStampsRes] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact' }).eq('business_id', business.id),
    supabase.from('stamps').select('id', { count: 'exact' }).eq('business_id', business.id),
    supabase.from('rewards').select('id', { count: 'exact' }).eq('business_id', business.id).eq('redeemed', false),
    supabase
      .from('stamps')
      .select('id, created_at, customers(name, phone)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const totalCustomers = customersRes.count ?? 0
  const totalStamps = stampsRes.count ?? 0
  const pendingRewards = rewardsRes.count ?? 0
  const recentStamps = recentStampsRes.data ?? []

  // Stamps this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: weeklyStamps } = await supabase
    .from('stamps')
    .select('id', { count: 'exact' })
    .eq('business_id', business.id)
    .gte('created_at', weekAgo.toISOString())

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/card/${business.id}`

  const stats = [
    { label: 'Total customers', value: totalCustomers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total stamps given', value: totalStamps, icon: Stamp, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Rewards pending', value: pendingRewards, icon: Gift, color: 'bg-amber-50 text-amber-600' },
    { label: 'Stamps this week', value: weeklyStamps ?? 0, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back to {business.name}</p>
        </div>
        <Link
          href="/dashboard/stamp"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Stamp className="w-4 h-4" />
          Give Stamp
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Business card */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-indigo-200 text-sm mb-1">Loyalty program</div>
            <div className="text-2xl font-bold">{business.reward_name}</div>
            <div className="text-indigo-200 text-sm mt-1">
              Earned after {business.reward_threshold} stamps
            </div>
          </div>
          <div className="flex gap-1 flex-wrap max-w-32 justify-end">
            {Array.from({ length: Math.min(business.reward_threshold, 12) }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <Stamp className="w-4 h-4 text-white/60" />
              </div>
            ))}
            {business.reward_threshold > 12 && (
              <div className="text-white/70 text-xs self-center">+{business.reward_threshold - 12}</div>
            )}
          </div>
        </div>
      </div>

      {/* Customer join link */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Link2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">Customer join link</div>
            <div className="text-xs text-gray-400 truncate">{joinUrl}</div>
          </div>
        </div>
        <CopyLinkButton url={joinUrl} />
      </div>

      {/* Recent stamps */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent stamps</h2>
          <Link href="/dashboard/customers" className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recentStamps.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <Stamp className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No stamps given yet. Start by adding a customer!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {(recentStamps as unknown as Array<{ id: string; created_at: string; customers: { name: string; phone: string } | null }>).map((s) => (
              <li key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {s.customers?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.customers?.name}</div>
                    <div className="text-xs text-gray-400">{s.customers?.phone}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
