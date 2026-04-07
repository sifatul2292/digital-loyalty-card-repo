import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, UserPlus, Stamp, Gift } from 'lucide-react'

export default async function CustomersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, reward_threshold')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/dashboard')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, birthday, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const customerIds = customers?.map((c) => c.id) ?? []

  const [stampsRes, rewardsRes] = await Promise.all([
    customerIds.length
      ? supabase.from('stamps').select('customer_id').in('customer_id', customerIds)
      : Promise.resolve({ data: [] }),
    customerIds.length
      ? supabase.from('rewards').select('customer_id, redeemed').in('customer_id', customerIds)
      : Promise.resolve({ data: [] }),
  ])

  const stampCounts: Record<string, number> = {}
  const pendingRewards: Record<string, number> = {}

  ;(stampsRes.data ?? []).forEach((s: { customer_id: string }) => {
    stampCounts[s.customer_id] = (stampCounts[s.customer_id] ?? 0) + 1
  })
  ;(rewardsRes.data ?? []).forEach((r: { customer_id: string; redeemed: boolean }) => {
    if (!r.redeemed) {
      pendingRewards[r.customer_id] = (pendingRewards[r.customer_id] ?? 0) + 1
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{customers?.length ?? 0} registered in your loyalty program</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add customer
        </Link>
      </div>

      {!customers?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No customers yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add your first customer to get started</p>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add customer
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                  <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Stamps</th>
                  <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Progress</th>
                  <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Rewards</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => {
                  const stamps = stampCounts[c.id] ?? 0
                  const pending = pendingRewards[c.id] ?? 0
                  const progressPct = (stamps % business.reward_threshold) / business.reward_threshold * 100
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                            {c.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{c.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <Stamp className="w-3.5 h-3.5 text-gray-400" />
                          {stamps}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24 mx-auto">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 text-center mt-1">
                            {stamps % business.reward_threshold}/{business.reward_threshold}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {pending > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                            <Gift className="w-3 h-3" />
                            {pending}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/customers/${c.id}`}
                          className="text-indigo-600 hover:underline text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
