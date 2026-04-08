'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Stamp, Loader2, CheckCircle, Gift, RotateCcw,
  Phone, ShieldCheck, ArrowLeft, XCircle,
} from 'lucide-react'

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
  phone: string
}

type PendingReward = {
  id: string
  redemption_code: string | null
}

type Step = 'pin' | 'lookup' | 'customer' | 'redeem'

const SESSION_KEY = 'staff_pin'

export default function StaffFlow({ business }: { business: Business }) {
  const [step, setStep] = useState<Step>('pin')
  const [pin, setPin] = useState('')
  const [phone, setPhone] = useState('')
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [stampCount, setStampCount] = useState(0)
  const [threshold, setThreshold] = useState(business.reward_threshold)
  const [rewardName, setRewardName] = useState(business.reward_name)
  const [pendingReward, setPendingReward] = useState<PendingReward | null>(null)
  const [redeemCode, setRedeemCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [stampSuccess, setStampSuccess] = useState(false)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [error, setError] = useState('')

  // Restore PIN from session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      setPin(saved)
      setStep('lookup')
    }
  }, [])

  // ── PIN Verification ────────────────────────────────────────────────────────
  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) return
    setLoading(true)
    setError('')

    // Test PIN by doing a dry lookup with a dummy phone — just need 401 vs 403/404
    // Instead: store PIN optimistically, fail on first real lookup
    sessionStorage.setItem(SESSION_KEY, pin)
    setLoading(false)
    setStep('lookup')
  }

  // ── Customer Lookup ─────────────────────────────────────────────────────────
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/staff/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, businessId: business.id, pin }),
    })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 401) {
        // Wrong PIN — send back to PIN screen
        sessionStorage.removeItem(SESSION_KEY)
        setPin('')
        setStep('pin')
        setError('Incorrect PIN — please try again.')
      } else {
        setError(data.error || 'Lookup failed')
      }
      setLoading(false)
      return
    }

    setCustomer(data.customer)
    setStampCount(data.stampCount)
    setThreshold(data.threshold)
    setRewardName(data.rewardName)
    setPendingReward(data.pendingReward)
    setStep('customer')
    setLoading(false)
  }

  // ── Add Stamp ───────────────────────────────────────────────────────────────
  async function handleStamp() {
    if (!customer) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/staff/stamp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: customer.id, businessId: business.id, pin }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to add stamp')
      setLoading(false)
      return
    }

    setStampCount(data.stampCount)
    if (data.newReward) setPendingReward(data.newReward)
    setStampSuccess(true)
    setLoading(false)
    setTimeout(() => setStampSuccess(false), 2000)
  }

  // ── Redeem Reward ────────────────────────────────────────────────────────────
  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    if (redeemCode.length !== 6) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/staff/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: customer?.id, businessId: business.id, pin, code: redeemCode }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Redemption failed')
      setLoading(false)
      return
    }

    // Reset state after redemption
    setRedeemSuccess(true)
    setPendingReward(null)
    setStampCount(0)
    setLoading(false)

    setTimeout(() => {
      setRedeemSuccess(false)
      resetToLookup()
    }, 2500)
  }

  function resetToLookup() {
    setStep('lookup')
    setPhone('')
    setCustomer(null)
    setStampCount(0)
    setPendingReward(null)
    setRedeemCode('')
    setError('')
  }

  function clearPin() {
    sessionStorage.removeItem(SESSION_KEY)
    setPin('')
    setStep('pin')
    resetToLookup()
  }

  const displayFilled = Math.min(stampCount, threshold)
  const remaining = threshold - displayFilled
  const cardFull = stampCount >= threshold

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Stamp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-none">{business.name}</div>
            <div className="text-xs text-gray-400">Staff Terminal</div>
          </div>
        </div>
        {step !== 'pin' && (
          <button
            onClick={clearPin}
            className="text-xs text-gray-400 flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Lock
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">

        {/* ── Step: PIN ── */}
        {step === 'pin' && (
          <div className="w-full max-w-xs">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Staff Access</h1>
              <p className="text-gray-500 text-sm mt-1">Enter the 4-digit staff PIN</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              <PINInput value={pin} onChange={setPin} />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={pin.length !== 4}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-4 rounded-2xl font-bold text-base transition-colors"
              >
                Unlock
              </button>
            </form>
          </div>
        )}

        {/* ── Step: Lookup ── */}
        {step === 'lookup' && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Find Customer</h1>
              <p className="text-gray-500 text-sm mt-1">Enter the customer&apos;s phone number</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoFocus
                placeholder="+1 555 000 0000"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-xl font-medium text-center focus:outline-none focus:border-indigo-500 transition-colors bg-white tracking-wider"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Phone className="w-6 h-6" />}
                Look Up
              </button>
            </form>
          </div>
        )}

        {/* ── Step: Customer Card ── */}
        {step === 'customer' && customer && (
          <div className="w-full max-w-sm space-y-4">

            {/* Customer header */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-2xl flex-shrink-0">
                {customer.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-gray-900 truncate">{customer.name}</div>
                <div className="text-sm text-gray-400">{customer.phone}</div>
              </div>
              <button onClick={resetToLookup} className="text-gray-300 hover:text-gray-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Reward ready banner */}
            {pendingReward && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 flex items-center gap-3">
                <Gift className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-amber-800 text-sm">Reward ready!</div>
                  <div className="text-amber-600 text-xs">Ask customer for their 6-digit code</div>
                </div>
                <button
                  onClick={() => { setStep('redeem'); setError('') }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                >
                  Redeem
                </button>
              </div>
            )}

            {/* Stamp card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5">
              {/* Progress text */}
              <div className="text-center mb-4">
                {cardFull ? (
                  <p className="text-green-600 font-bold">Card complete — reward ready!</p>
                ) : stampCount === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Needs <span className="font-bold text-indigo-600">{threshold} stamps</span> for a free{' '}
                    <span className="font-bold text-indigo-600">{rewardName}</span>
                  </p>
                ) : (
                  <p className="text-gray-700 text-sm">
                    <span className="font-bold text-indigo-600">{remaining} more stamp{remaining !== 1 ? 's' : ''}</span>{' '}
                    for a free <span className="font-bold text-indigo-600">{rewardName}</span>
                  </p>
                )}
              </div>

              {/* Stamp circles */}
              <div className="flex flex-wrap gap-2.5 justify-center mb-5">
                {Array.from({ length: threshold }).map((_, i) => {
                  const filled = i < displayFilled
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        filled
                          ? 'bg-green-500 shadow-md shadow-green-200'
                          : 'bg-gray-100 border-2 border-dashed border-gray-300'
                      }`}
                    >
                      {filled
                        ? <CheckCircle className="w-7 h-7 text-white" />
                        : <Stamp className="w-5 h-5 text-gray-300" />
                      }
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cardFull ? 'bg-green-500' : 'bg-indigo-500'}`}
                  style={{ width: `${(displayFilled / threshold) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-center">{displayFilled}/{threshold} stamps</div>
            </div>

            {/* Add Stamp button */}
            <button
              onClick={handleStamp}
              disabled={loading}
              className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-lg ${
                stampSuccess
                  ? 'bg-green-500 shadow-green-200 text-white'
                  : 'bg-green-600 hover:bg-green-700 shadow-green-200 text-white active:scale-95'
              } disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : stampSuccess ? (
                <><CheckCircle className="w-7 h-7" /> Stamp Added!</>
              ) : (
                <><Stamp className="w-7 h-7" /> Add Stamp</>
              )}
            </button>

            <button
              onClick={resetToLookup}
              className="w-full py-3 rounded-2xl font-medium text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Search another customer
            </button>
          </div>
        )}

        {/* ── Step: Redeem ── */}
        {step === 'redeem' && customer && (
          <div className="w-full max-w-sm">
            <button
              onClick={() => { setStep('customer'); setRedeemCode(''); setError('') }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-7 h-7 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Redeem Reward</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Ask <span className="font-semibold text-gray-700">{customer.name}</span> to show their code
                </p>
              </div>

              {redeemSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <div className="text-green-700 font-bold text-lg">Reward Redeemed!</div>
                  <div className="text-gray-400 text-sm mt-1">Stamps reset — new cycle started</div>
                </div>
              ) : (
                <form onSubmit={handleRedeem} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 text-center mb-3">
                      Customer&apos;s 6-digit code
                    </label>
                    <OTPInput value={redeemCode} onChange={setRedeemCode} />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || redeemCode.length !== 6}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
                    Confirm Redemption
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 4-Digit PIN Input ────────────────────────────────────────────────────────
function PINInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const LENGTH = 4
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

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          autoFocus={i === 0}
          className="w-16 h-20 text-center text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
        />
      ))}
    </div>
  )
}

// ── 6-Digit OTP Input (for redemption code) ──────────────────────────────────
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
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
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
          className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
        />
      ))}
    </div>
  )
}
