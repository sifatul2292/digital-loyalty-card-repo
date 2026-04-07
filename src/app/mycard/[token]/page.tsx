import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Stamp, Gift, Star, CheckCircle } from 'lucide-react'

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
    supabase.from('rewards').select('id, redeemed, redemption_code, created_at').eq('customer_id', customer.id).order('created_at', { ascending: false }),
  ])

  const stamps = stampsRes.data ?? []
  const rewards = rewardsRes.data ?? []
  const pendingRewards = rewards.filter((r) => !r.redeemed)
  const activeReward = pendingRewards[0] ?? null
  const currentProgress = stamps.length % business.reward_threshold
  const cardFull = stamps.length > 0 && currentProgress === 0
  const displayFilled = cardFull ? business.reward_threshold : currentProgress
  const stampsUntilReward = business.reward_threshold - displayFilled

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        {/* Business header */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Stamp className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 text-sm">{business.type}</p>
        </div>

        {/* Reward ready banner */}
        {activeReward && (
          <div className="bg-green-500 rounded-3xl p-5 text-white shadow-lg shadow-green-200">
            <div className="flex items-center gap-2 text-lg font-bold mb-1">
              <Gift className="w-6 h-6" />
              Reward Ready!
            </div>
            <p className="text-green-100 text-sm mb-4">
              Show this code to claim your <strong>{business.reward_name}</strong>
            </p>
            <div className="bg-white/20 rounded-2xl px-4 py-3 text-center">
              <span className="font-mono text-3xl font-bold tracking-[0.25em] text-white">
                {activeReward.redemption_code ?? '——'}
              </span>
            </div>
            {pendingRewards.length > 1 && (
              <p className="text-green-100 text-xs text-center mt-2">
                +{pendingRewards.length - 1} more reward{pendingRewards.length - 1 > 1 ? 's' : ''} waiting
              </p>
            )}
          </div>
        )}

        {/* Loyalty card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-indigo-200 text-xs uppercase tracking-wider">Loyalty Card</div>
                <div className="text-white font-bold text-lg mt-0.5">{customer.name}</div>
              </div>
              <div className="text-right">
                <div className="text-indigo-200 text-xs">Reward</div>
                <div className="text-white text-sm font-semibold">{business.reward_name}</div>
              </div>
            </div>
          </div>

          <div className="p-5">
            {/* Progress message */}
            <div className="mb-4 text-center">
              {cardFull ? (
                <p className="text-green-600 font-bold text-sm">🎉 Card complete!</p>
              ) : stampsUntilReward === 0 ? (
                <p className="text-green-600 font-semibold text-sm">Reward earned!</p>
              ) : (
                <p className="text-gray-700 text-sm">
                  <span className="font-bold text-indigo-600">{stampsUntilReward} more stamp{stampsUntilReward !== 1 ? 's' : ''}</span>{' '}
                  for your free <span className="font-bold text-indigo-600">{business.reward_name}</span>!
                </p>
              )}
            </div>

            {/* Stamp circles */}
            <div className="flex flex-wrap gap-2.5 justify-center mb-4">
              {Array.from({ length: business.reward_threshold }).map((_, i) => {
                const filled = i < displayFilled
                return (
                  <div
                    key={i}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      filled
                        ? 'bg-green-500 shadow-md shadow-green-200'
                        : 'bg-gray-100 border-2 border-dashed border-gray-300'
                    }`}
                  >
                    {filled ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Stamp className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${cardFull ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${(displayFilled / business.reward_threshold) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>{displayFilled}/{business.reward_threshold} stamps</span>
              <span>{Math.round((displayFilled / business.reward_threshold) * 100)}%</span>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-1.5 text-gray-300 text-xs">
            <Star className="w-3 h-3" />
            <span>Powered by StampLoop</span>
          </div>
        </div>
      </div>
    </div>
  )
}
