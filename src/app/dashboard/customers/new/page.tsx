'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react'

function NewCustomerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '')
  const [birthday, setBirthday] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) {
      setError('Business not found')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('customers').insert({
      name,
      phone: phone.replace(/\D/g, ''),
      birthday: birthday || null,
      business_id: business.id,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('A customer with that phone number already exists.')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard/customers')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/customers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add customer</h1>
          <p className="text-gray-500 text-sm mt-0.5">Register a new customer in your loyalty program</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="+1 555 123 4567"
            />
            <p className="text-xs text-gray-400 mt-1">Used to look up the customer when giving stamps</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Birthday <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Link
              href="/dashboard/customers"
              className="flex-1 text-center py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add customer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewCustomerPage() {
  return (
    <Suspense>
      <NewCustomerForm />
    </Suspense>
  )
}
