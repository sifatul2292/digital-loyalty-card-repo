'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Stamp, Search, CheckCircle, Gift, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'

type CustomerResult = {
  id: string
  name: string
  phone: string
  stampCount: number
  pendingRewards: number
  threshold: number
}

export default function StampPage() {
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [customer, setCustomer] = useState<CustomerResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [stamping, setStamping] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function searchCustomer(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setNotFound(false)
    setCustomer(null)
    setSuccess(false)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id, reward_threshold')
      .eq('owner_id', user.id)
      .single()

    if (!business) {
      setError('Business not found')
      setSearching(false)
      return
    }

    const { data: found } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('phone', phone.replace(/\D/g, ''))
      .eq('business_id', business.id)
      .single()

    if (!found) {
      setNotFound(true)
      setSearching(false)
      return
    }

    const [stampsRes, rewardsRes] = await Promise.all([
      supabase.from('stamps').select('id', { count: 'exact' }).eq('customer_id', found.id),
      supabase.from('rewards').select('id', { count: 'exact' }).eq('customer_id', found.id).eq('redeemed', false),
    ])

    setCustomer({
      id: found.id,
      name: found.name,
      phone: found.phone,
      stampCount: stampsRes.count ?? 0,
      pendingRewards: rewardsRes.count ?? 0,
      threshold: business.reward_threshold,
    })
    setSearching(false)
  }

  async function giveStamp() {
    if (!customer) return
    setStamping(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id, reward_threshold, reward_name')
      .eq('owner_id', user.id)
      .single()

    if (!business) return

    const { error: stampError } = await supabase.from('stamps').insert({
      customer_id: customer.id,
      business_id: business.id,
    })

    if (stampError) {
      setError(stampError.message)
      setStamping(false)
      return
    }

    const newCount = customer.stampCount + 1
    if (newCount % business.reward_threshold === 0) {
      await supabase.from('rewards').insert({
        customer_id: customer.id,
        business_id: business.id,
      })
    }

    setCustomer({ ...customer, stampCount: newCount })
    setSuccess(true)
    setStamping(false)

    setTimeout(() => setSuccess(false), 2500)
  }

  const progress = customer ? (customer.stampCount % customer.threshold) / customer.threshold * 100 : 0

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Give Stamp</h1>
        <p className="text-gray-500 text-sm mt-1">Search a customer by phone number to give a stamp</p>
      </div>

      {/* Search */}
      <form onSubmit={searchCustomer} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number…"
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60 transition-colors"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Not found */}
      {notFound && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-medium mb-1">Customer not found</p>
          <p className="text-amber-600 text-sm mb-4">No customer with that phone number in your program.</p>
          <Link
            href={`/dashboard/customers/new?phone=${encodeURIComponent(phone)}`}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add this customer
          </Link>
        </div>
      )}

      {/* Customer card */}
      {customer && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                {customer.name[0].toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{customer.name}</div>
                <div className="text-gray-400 text-sm">{customer.phone}</div>
              </div>
              {customer.pendingRewards > 0 && (
                <div className="ml-auto flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Gift className="w-4 h-4" />
                  {customer.pendingRewards} reward{customer.pendingRewards > 1 ? 's' : ''} ready
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{customer.stampCount % customer.threshold} / {customer.threshold} stamps</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stamp dots */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.from({ length: customer.threshold }).map((_, i) => {
                const filled = i < (customer.stampCount % customer.threshold)
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      filled
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Stamp className={`w-4 h-4 ${filled ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                )
              })}
            </div>

            <button
              onClick={giveStamp}
              disabled={stamping}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                success
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-60`}
            >
              {stamping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Stamp given!
                </>
              ) : (
                <>
                  <Stamp className="w-5 h-5" />
                  Give Stamp
                </>
              )}
            </button>
          </div>

          <div className="border-t border-gray-50 px-6 py-3 bg-gray-50 flex justify-between text-xs text-gray-400">
            <span>Total stamps all-time: {customer.stampCount}</span>
            <Link href={`/dashboard/customers/${customer.id}`} className="text-indigo-600 hover:underline">
              View profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
