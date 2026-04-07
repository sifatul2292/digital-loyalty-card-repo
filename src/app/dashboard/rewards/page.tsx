import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Gift, CheckCircle } from 'lucide-react'

type RewardRow = {
  id: string
  redeemed: boolean
  redeemed_at: string | null
  created_at: string
  customers: { id: string; name: string; phone: string } | null
}

export default async function RewardsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, reward_name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/dashboard')

  const { data: rewards } = await supabase
    .from('rewards')
    .select('id, redeemed, redeemed_at, created_at, customers(id, name, phone)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const allRewards = (rewards ?? []) as unknown as RewardRow[]
  const pending = allRewards.filter((r) => !r.redeemed)
  const redeemed = allRewards.filter((r) => r.redeemed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pending.length} pending · {redeemed.length} redeemed
        </p>
      </div>

      {/* Pending */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" />
          Pending rewards ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-400 text-sm">
            No pending rewards
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {pending.map((r) => (
                <li key={r.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                      {r.customers?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{r.customers?.name}</div>
                      <div className="text-xs text-gray-400">{r.customers?.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{business.reward_name}</div>
                      <div className="text-xs text-gray-400">Earned {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <Link
                      href={`/dashboard/customers/${r.customers?.id}`}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Redeem
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Redeemed */}
      {redeemed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Redeemed ({redeemed.length})
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {redeemed.map((r) => (
                <li key={r.id} className="px-6 py-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                      {r.customers?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">{r.customers?.name}</div>
                      <div className="text-xs text-gray-400">{r.customers?.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{business.reward_name}</div>
                    <div className="text-xs text-gray-400">
                      Redeemed {r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
