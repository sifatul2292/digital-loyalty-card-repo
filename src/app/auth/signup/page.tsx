'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Stamp, Loader2 } from 'lucide-react'

const BUSINESS_TYPES = [
  'Cafe', 'Restaurant', 'Bakery', 'Bar', 'Salon', 'Barber', 'Gym',
  'Retail', 'Spa', 'Food Truck', 'Pizza', 'Sushi', 'Other',
]

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep] = useState<'account' | 'business'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [rewardThreshold, setRewardThreshold] = useState(10)
  const [rewardName, setRewardName] = useState('Free Coffee')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (step === 'account') {
      setStep('business')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: authData, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError || !authData.user) {
      setError(signupError?.message || 'Signup failed')
      setLoading(false)
      return
    }

    const { error: bizError } = await supabase.from('businesses').insert({
      name: businessName,
      type: businessType || 'Other',
      reward_threshold: rewardThreshold,
      reward_name: rewardName,
      win_back_enabled: false,
      owner_id: authData.user.id,
    })

    if (bizError) {
      setError(bizError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Stamp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">StampLoop</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'account' ? 'Create your account' : 'Set up your business'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 'account' ? 'Step 1 of 2 — Account details' : 'Step 2 of 2 — Business profile'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-4">
            {step === 'account' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="you@business.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="At least 6 characters"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Brew & Co."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select type…</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Stamps to reward</label>
                    <input
                      type="number"
                      value={rewardThreshold}
                      onChange={(e) => setRewardThreshold(Number(e.target.value))}
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
              </>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === 'account' ? 'Continue' : 'Create business'}
            </button>

            {step === 'business' && (
              <button
                type="button"
                onClick={() => setStep('account')}
                className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
              >
                ← Back
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
