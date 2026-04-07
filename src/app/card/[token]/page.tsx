import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Stamp, Gift, Star } from 'lucide-react'

export default async function CustomerCardPage({ params }: { params: { token: string } }) {
  const supabase = createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, phone, business_id, created_at')
    .eq('card_token', params.token)
    .single()

  if (!customer) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, type, reward_threshold, reward_name')
    .eq('id', customer.business_id)
    .single()

  if (!business) notFound()

  const [stampsRes, rewardsRes] = await Promise.all([
    supabase.from('stamps').select('id, created_at').eq('customer_id', customer.id).order('created_at', { ascending: false }),
    supabase.from('rewards').select('id, redeemed, created_at').eq('customer_id', customer.id).order('created_at', { ascending: false }),
  ])

  const stamps = stampsRes.data ?? []
  const rewards = rewardsRes.data ?? []
  const pendingRewards = rewards.filter((r) => !r.redeemed)
  const currentProgress = stamps.length % business.reward_threshold
  const progressPct = currentProgress / business.reward_threshold * 100
  const stampsUntilReward = business.reward_threshold - currentProgress

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Business header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Stamp className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 text-sm">{business.type}</p>
        </div>

        {/* Pending rewards banner */}
        {pendingRewards.length > 0 && (
          <div className="bg-amber-400 rounded-2xl p-4 mb-4 text-center shadow-md">
            <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-1">
              <Gift className="w-5 h-5" />
              {pendingRewards.length === 1 ? 'You have a reward!' : `You have ${pendingRewards.length} rewards!`}
            </div>
            <p className="text-amber-100 text-sm">Show this screen to claim your <strong>{business.reward_name}</strong></p>
          </div>
        )}

        {/* Loyalty card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 pt-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-indigo-200 text-xs uppercase tracking-wider">Loyalty Card</div>
                <div className="text-white font-bold text-lg mt-0.5">{customer.name}</div>
              </div>
              <div className="text-right">
                <div className="text-indigo-200 text-xs">Reward</div>
                <div className="text-white text-sm font-semibold">{business.reward_name}</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-indigo-200 mb-2">
                <span>{currentProgress} / {business.reward_threshold} stamps</span>
                {stampsUntilReward > 0 ? (
                  <span>{stampsUntilReward} more to go!</span>
                ) : (
                  <span className="text-amber-300 font-semibold">Reward earned!</span>
                )}
              </div>
              <div className="h-2 bg-indigo-800/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stamp grid */}
          <div className="px-6 py-5">
            <div className="flex flex-wrap gap-2.5 justify-center">
              {Array.from({ length: business.reward_threshold }).map((_, i) => {
                const filled = i < currentProgress
                return (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      filled
                        ? 'bg-indigo-500 border-indigo-500 shadow-md shadow-indigo-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Stamp className={`w-5 h-5 ${filled ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats footer */}
          <div className="border-t border-gray-100 px-6 py-4 grid grid-cols-3 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{stamps.length}</div>
              <div className="text-xs text-gray-400">Total stamps</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{rewards.length}</div>
              <div className="text-xs text-gray-400">Rewards earned</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{pendingRewards.length}</div>
              <div className="text-xs text-gray-400">Ready to use</div>
            </div>
          </div>
        </div>

        {/* Recent stamps */}
        {stamps.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Recent visits</h3>
            </div>
            <ul className="divide-y divide-gray-50">
              {stamps.slice(0, 5).map((s, i) => (
                <li key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                      <Stamp className="w-3 h-3 text-indigo-500" />
                    </div>
                    <span className="text-sm text-gray-600">Visit #{stamps.length - i}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs">
            <Star className="w-3 h-3" />
            <span>Powered by StampLoop</span>
          </div>
        </div>
      </div>
    </div>
  )
}
