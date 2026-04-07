import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Stamp, Gift, ExternalLink, Calendar, Phone } from 'lucide-react'
import RedeemButton from './RedeemButton'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, reward_threshold, reward_name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/dashboard')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', business.id)
    .single()

  if (!customer) notFound()

  const [stampsRes, rewardsRes] = await Promise.all([
    supabase
      .from('stamps')
      .select('id, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('rewards')
      .select('id, redeemed, redeemed_at, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false }),
  ])

  const stamps = stampsRes.data ?? []
  const rewards = rewardsRes.data ?? []
  const currentProgress = stamps.length % business.reward_threshold
  const progressPct = currentProgress / business.reward_threshold * 100

  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/card/${customer.card_token}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/customers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-2xl flex-shrink-0">
            {customer.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </div>
              {customer.birthday && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Birthday: {new Date(customer.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
          <a
            href={cardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Card
          </a>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Toward {business.reward_name}</span>
            <span className="text-gray-400">{currentProgress}/{business.reward_threshold}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: business.reward_threshold }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                  i < currentProgress ? 'bg-indigo-500 border-indigo-500' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Stamp className={`w-4 h-4 ${i < currentProgress ? 'text-white' : 'text-gray-300'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-400">
          <span>Total stamps: {stamps.length}</span>
          <span>Member since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Rewards */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-500" />
            Rewards ({rewards.length})
          </h3>
        </div>
        {rewards.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No rewards yet</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rewards.map((r) => (
              <li key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{business.reward_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Earned {new Date(r.created_at).toLocaleDateString()}
                    {r.redeemed && r.redeemed_at && ` · Redeemed ${new Date(r.redeemed_at).toLocaleDateString()}`}
                  </div>
                </div>
                {r.redeemed ? (
                  <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full font-medium">Redeemed</span>
                ) : (
                  <RedeemButton rewardId={r.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stamp history */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Stamp className="w-4 h-4 text-indigo-500" />
            Stamp history ({stamps.length})
          </h3>
        </div>
        {stamps.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No stamps yet</div>
        ) : (
          <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {stamps.map((s, i) => (
              <li key={s.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Stamp className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <span className="text-sm text-gray-700">Stamp #{stamps.length - i}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
