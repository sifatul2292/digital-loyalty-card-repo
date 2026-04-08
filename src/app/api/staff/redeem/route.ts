import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const { customerId, businessId, pin, code } = await request.json()

    if (!customerId || !businessId || !pin || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify PIN
    const { data: business } = await supabase
      .from('businesses')
      .select('id, staff_pin')
      .eq('id', businessId)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    if (business.staff_pin !== pin) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })

    // Find matching pending reward
    const { data: reward } = await supabase
      .from('rewards')
      .select('id')
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .eq('redeemed', false)
      .eq('redemption_code', code.trim())
      .maybeSingle()

    if (!reward) {
      return NextResponse.json({ error: 'Invalid code — no matching reward found.' }, { status: 400 })
    }

    // Mark as redeemed with timestamp (used for next-cycle stamp counting)
    const { error: updateError } = await supabase
      .from('rewards')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', reward.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Redemption failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
