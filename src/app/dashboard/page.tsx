import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Users, Stamp, Gift, AlertTriangle,
  UserPlus, QrCode, Link2, ArrowRight,
  TrendingUp, Crown, Activity,
} from 'lucide-react'
import CopyLinkButton from '@/components/CopyLinkButton'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, type, reward_threshold, reward_name')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Set up your business first</h2>
        <p className="text-gray-500 mb-6 max-w-xs">Add your business details to start your loyalty program.</p>
        <Link href="/dashboard/settings" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
          Go to Settings
        </Link>
      </div>
    )
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    recentStampsRes,
    allStampsRes,
    redeemedRes,
    customersRes,
    recentActivityRes,
  ] = await Promise.all([
    // Stamps in last 30 days (for visits + active customer count)
    supabase
      .from('stamps')
      .select('customer_id')
      .eq('business_id', business.id)
      .gte('created_at', thirtyDaysAgo),

    // All stamps ever (for regulars + lapsed)
    supabase
      .from('stamps')
      .select('customer_id, created_at')
      .eq('business_id', business.id),

    // Rewards redeemed all-time
    supabase
      .from('rewards')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('redeemed', true),

    // All customers
    supabase
      .from('customers')
      .select('id, name, phone')
      .eq('business_id', business.id),

    // Recent activity (stamps + customer name)
    supabase
      .from('stamps')
      .select('id, created_at, customers(id, name, phone)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  // ── Stat calculations ───────────────────────────────────────────────────────
  const recentStamps = recentStampsRes.data ?? []
  const allStamps = allStampsRes.data ?? []
  const customers = customersRes.data ?? []

  const totalVisits30 = recentStamps.length
  const activeCustomerIds = new Set(recentStamps.map((s) => s.customer_id))
  const activeCustomers = activeCustomerIds.size
  const rewardsRedeemed = redeemedRes.count ?? 0

  // Lapsed: has stamps ever, but none in last 30 days
  const customersWithAnyStamp = new Set(allStamps.map((s) => s.customer_id))
  const lapsedCustomers = customers.filter(
    (c) => customersWithAnyStamp.has(c.id) && !activeCustomerIds.has(c.id)
  ).length

  // ── Top 5 regulars ──────────────────────────────────────────────────────────
  const stampCountMap: Record<string, number> = {}
  allStamps.forEach((s) => {
    stampCountMap[s.customer_id] = (stampCountMap[s.customer_id] ?? 0) + 1
  })
  const top5 = Object.entries(stampCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([customerId, count]) => ({
      customer: customers.find((c) => c.id === customerId) ?? null,
      count,
    }))
    .filter((r) => r.customer !== null)

  // ── Join URL ────────────────────────────────────────────────────────────────
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const joinUrl = `${appUrl}/card/${business.id}`

  // ── Recent activity ─────────────────────────────────────────────────────────
  type ActivityRow = {
    id: string
    created_at: string
    customers: { id: string; name: string; phone: string } | null
  }
  const activity = (recentActivityRes.data ?? []) as unknown as ActivityRow[]

  const stats = [
    {
      label: 'Visits (30 days)',
      value: totalVisits30,
      icon: TrendingUp,
      color: 'bg-indigo-50 text-indigo-600',
      sub: 'Total stamp scans',
    },
    {
      label: 'Active customers',
      value: activeCustomers,
      icon: Users,
      color: 'bg-green-50 text-green-600',
      sub: 'Visited in last 30 days',
    },
    {
      label: 'Rewards redeemed',
      value: rewardsRedeemed,
      icon: Gift,
      color: 'bg-amber-50 text-amber-600',
      sub: 'All-time total',
    },
    {
      label: 'Lapsed customers',
      value: lapsedCustomers,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-500',
      sub: 'No visit in 30+ days',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back · <span className="font-medium text-gray-700">{business.name}</span>
        </p>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900">{value}</div>
              <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Top Regulars ───────────────────────────────────────────────── */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Top Regulars
            </h2>
            <Link href="/dashboard/customers" className="text-xs text-indigo-600 hover:underline">
              See all
            </Link>
          </div>

          {top5.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No stamps yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {top5.map(({ customer, count }, i) => (
                <li key={customer!.id} className="px-5 py-3.5 flex items-center gap-3">
                  {/* Rank badge */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-gray-300 text-white' :
                    i === 2 ? 'bg-orange-300 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                    {customer!.name[0].toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/customers/${customer!.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
                    >
                      {customer!.name}
                    </Link>
                    <div className="text-xs text-gray-400">{customer!.phone}</div>
                  </div>

                  {/* Stamp count */}
                  <div className="flex items-center gap-1 text-sm font-bold text-indigo-600 flex-shrink-0">
                    <Stamp className="w-3.5 h-3.5" />
                    {count}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right column: Quick Actions + Activity ──────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Quick Actions
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/customers/new"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Add Customer</div>
                  <div className="text-xs text-gray-400">Register manually</div>
                </div>
              </Link>

              <Link
                href="/dashboard/qr"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">QR Code</div>
                  <div className="text-xs text-gray-400">Print for counter</div>
                </div>
              </Link>

              <Link
                href="/dashboard/customers"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Customers</div>
                  <div className="text-xs text-gray-400">{customers.length} total</div>
                </div>
              </Link>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">Join Link</div>
                  <div className="text-xs text-gray-400 truncate">Share with customers</div>
                </div>
                <CopyLinkButton url={joinUrl} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-indigo-400" />
                Recent Activity
              </h2>
              <Link href="/dashboard/customers" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                All customers <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {activity.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Stamp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No activity yet — start giving stamps!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {activity.map((a) => {
                  const name = a.customers?.name ?? 'Unknown'
                  const phone = a.customers?.phone ?? ''
                  const customerId = a.customers?.id
                  const date = new Date(a.created_at)
                  const isToday = new Date().toDateString() === date.toDateString()
                  const timeStr = isToday
                    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                  return (
                    <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                        {name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {customerId ? (
                          <Link
                            href={`/dashboard/customers/${customerId}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{name}</span>
                        )}
                        <div className="text-xs text-gray-400">{phone}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-medium px-2 py-1 rounded-full">
                          <Stamp className="w-3 h-3" />
                          Stamp
                        </span>
                        <span className="text-xs text-gray-400 w-12 text-right">{timeStr}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
