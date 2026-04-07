'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function RedeemButton({ rewardId }: { rewardId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function redeem() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('rewards')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', rewardId)
    router.refresh()
  }

  return (
    <button
      onClick={redeem}
      disabled={loading}
      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
      Redeem
    </button>
  )
}
