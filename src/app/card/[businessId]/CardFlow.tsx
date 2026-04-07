'use client'

import { useRef, useState } from 'react'
import { Stamp, Loader2, CheckCircle, Gift, ChevronRight, RotateCcw } from 'lucide-react'

type Business = {
  id: string
  name: string
  type: string
  reward_threshold: number
  reward_name: string
}

type CustomerData = {
  id: string
  name: string
  card_token: string
  isNew: boolean
}

type StampRow = { id: string; created_at: string }
type RewardRow = { id: string; redeemed: boolean; redemption_code: string | null; created_at: string }

type Step = 'phone' | 'otp' | 'card'

export default function CardFlow({ business }: { business: Business }) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [stamps, setStamps] = useState<StampRow[]>([])
  const [rewards, setRewards] = useState<RewardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, businessId: business.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to send code')
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/verify/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: otp, businessId: business.id, name: name || undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Invalid code')
      setLoading(false)
      return
    }

    setCustomer(data.customer)
    setStamps(data.stamps)
    setRewards(data.rewards)
    setIsNew(data.customer.isNew)
    setStep('card')
    setLoading(false)
  }

  async function handleResend() {
    setError('')
    setOtp('')
    await fetch('/api/verify/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, businessId: business.id }),
    })
  }

  const threshold = business.reward_threshold
  const totalStamps = stamps.length
  const currentProgress = totalStamps === 0 ? 0 : totalStamps % threshold
  const cardFull = totalStamps > 0 && currentProgress === 0
  const displayFilled = cardFull ? threshold : currentProgress
  const remaining = threshold - displayFilled
  const pendingRewards = rewards.filter(r => !r.redeemed)
  const activeReward = pendingRewards[0] ?? null

  return (
    <div className="flex flex-col items-center px-4 py-8 min-h-screen">
      {/* Business header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
          <Stamp className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
        <p className="text-gray-500 text-sm">{business.type} · Loyalty Card</p>
      </div>

      {/* Step: Phone */}
      {step === 'phone' && (
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Get your loyalty card</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your phone to join {business.name}&apos;s rewards program.
            </p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Only needed when joining for the first time</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+1 555 123 4567"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                Send verification code
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5 px-4">
            A 6-digit code will be sent to your phone. Standard message rates may apply.
          </p>
        </div>
      )}

      {/* Step: OTP */}
      {step === 'otp' && (
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Enter your code</h2>
            <p className="text-gray-500 text-sm mb-6">
              We sent a 6-digit code to <span className="font-medium text-gray-800">{phone}</span>
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <OTPInput value={otp} onChange={setOtp} />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Verify
              </button>
            </form>
          </div>

          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              ← Change number
            </button>
            <span className="text-gray-200">|</span>
            <button onClick={handleResend} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              Resend code
            </button>
          </div>
        </div>
      )}

      {/* Step: Card */}
      {step === 'card' && customer && (
        <div className="w-full max-w-sm space-y-4">
          {/* Welcome toast for new users */}
          {isNew && (
            <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-medium text-center shadow-md shadow-indigo-200">
              🎉 Welcome to {business.name}&apos;s loyalty program, {customer.name}!
            </div>
          )}

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

          {/* Stamp card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-indigo-200 text-xs uppercase tracking-wider">Loyalty Card</div>
                  <div className="text-white font-bold text-lg leading-none mt-0.5">{customer.name}</div>
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
                {cardFull && activeReward ? (
                  <p className="text-green-600 font-bold text-base">
                    🎉 Card complete — reward ready above!
                  </p>
                ) : cardFull ? (
                  <p className="text-green-600 font-semibold text-sm">
                    Card complete! Ask staff to issue your reward.
                  </p>
                ) : displayFilled === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Collect <span className="font-bold text-indigo-600">{threshold} stamps</span> for your free{' '}
                    <span className="font-bold text-indigo-600">{business.reward_name}</span>
                  </p>
                ) : (
                  <p className="text-gray-700 text-sm">
                    <span className="font-bold text-indigo-600">{remaining} more stamp{remaining !== 1 ? 's' : ''}</span>{' '}
                    for your free{' '}
                    <span className="font-bold text-indigo-600">{business.reward_name}</span>!
                  </p>
                )}
              </div>

              {/* Stamp circles */}
              <div className="flex flex-wrap gap-2.5 justify-center mb-4">
                {Array.from({ length: threshold }).map((_, i) => {
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
                  style={{ width: `${(displayFilled / threshold) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{displayFilled}/{threshold} stamps</span>
                <span>{Math.round((displayFilled / threshold) * 100)}%</span>
              </div>
            </div>

            {/* Stats footer */}
            <div className="border-t border-gray-50 grid grid-cols-3 text-center px-4 py-3">
              <div>
                <div className="text-base font-bold text-gray-900">{totalStamps}</div>
                <div className="text-xs text-gray-400">All stamps</div>
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">{rewards.length}</div>
                <div className="text-xs text-gray-400">Earned</div>
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">{pendingRewards.length}</div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 pt-1">
            Ask staff to scan or give you a stamp after each visit.
          </p>
        </div>
      )}

      <div className="mt-auto pt-10 text-center">
        <p className="text-xs text-gray-300">Powered by StampLoop</p>
      </div>
    </div>
  )
}

// ── OTP Input ────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const LENGTH = 6
  const digits = value.padEnd(LENGTH, '').slice(0, LENGTH).split('')

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = char
    onChange(next.join('').trimEnd())
    if (char && i < LENGTH - 1) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]
        next[i] = ''
        onChange(next.join('').trimEnd())
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, LENGTH - 1)
    refs.current[focusIndex]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
        />
      ))}
    </div>
  )
}
