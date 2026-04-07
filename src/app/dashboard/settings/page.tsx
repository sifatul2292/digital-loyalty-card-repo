'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { Business } from '@/lib/supabase/types'

const BUSINESS_TYPES = [
  'Cafe', 'Restaurant', 'Bakery', 'Bar', 'Salon', 'Barber', 'Gym',
  'Retail', 'Spa', 'Food Truck', 'Pizza', 'Sushi', 'Other',
]

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [type, setType] = useState('Cafe')
  const [threshold, setThreshold] = useState(10)
  const [rewardName, setRewardName] = useState('Free Item')
  const [winBack, setWinBack] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setLoadError('Not authenticated. Please sign in again.')
          setLoading(false)
          return
        }
        setUserId(user.id)

        const { data, error: bizError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (bizError && bizError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine
          setLoadError(bizError.message)
        } else if (data) {
          const biz = data as Business
          setBusiness(biz)
          setName(biz.name)
          setType(biz.type)
          setThreshold(biz.reward_threshold)
          setRewardName(biz.reward_name)
          setWinBack(biz.win_back_enabled)
        }
      } catch (e) {
        setLoadError('Failed to load business data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()

    if (business) {
      // Update existing business
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          name,
          type,
          reward_threshold: threshold,
          reward_name: rewardName,
          win_back_enabled: winBack,
        })
        .eq('id', business.id)
        .eq('owner_id', business.owner_id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } else if (userId) {
      // Create business if it doesn't exist yet (e.g. email confirmation flow)
      const { data, error: insertError } = await supabase
        .from('businesses')
        .insert({
          name,
          type,
          reward_threshold: threshold,
          reward_name: rewardName,
          win_back_enabled: winBack,
          owner_id: userId,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
      } else {
        setBusiness(data as Business)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } else {
      setError('Not authenticated. Please refresh and try again.')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your business profile and loyalty program</p>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {!business && !loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          No business profile found. Fill in the details below to create one.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            Business details
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brew & Co."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <hr className="border-gray-100" />
          <h2 className="font-semibold text-gray-900">Loyalty program</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stamps to earn reward</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min={1}
                max={50}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reward name</label>
              <input
                type="text"
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Free Coffee"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="text-sm font-medium text-gray-900">Win-back mode</div>
              <div className="text-xs text-gray-500 mt-0.5">Get notified when loyal customers haven&apos;t visited in 30+ days</div>
            </div>
            <button
              type="button"
              onClick={() => setWinBack(!winBack)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                winBack ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  winBack ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !!loadError}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } disabled:opacity-60`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              business ? 'Save changes' : 'Create business'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
