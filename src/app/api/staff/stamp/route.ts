import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const { customerId, businessId, pin } = await request.json()

    if (!customerId || !businessId || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify PIN
    const { data: business } = await supabase
      .from('businesses')
      .select('id, staff_pin, reward_threshold, reward_name')
      .eq('id', businessId)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    if (business.staff_pin !== pin) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })

    // Insert stamp
    const { error: stampError } = await supabase.from('stamps').insert({
      customer_id: customerId,
      business_id: businessId,
    })
    if (stampError) return NextResponse.json({ error: stampError.message }, { status: 500 })

    // Count stamps in current cycle (since last redemption)
    const { data: lastRedemption } = await supabase
      .from('rewards')
      .select('redeemed_at')
      .eq('customer_id', customerId)
      .eq('business_id', businessId)
      .eq('redeemed', true)
      .not('redeemed_at', 'is', null)
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const stampQuery = supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customerId)
      .eq('business_id', businessId)

    const { count: stampCount } = lastRedemption?.redeemed_at
      ? await stampQuery.gte('created_at', lastRedemption.redeemed_at)
      : await stampQuery

    const count = stampCount ?? 0

    // Check if threshold reached — create reward if no pending one exists
    let newReward: { id: string; redemption_code: string } | null = null
    if (count > 0 && count % business.reward_threshold === 0) {
      const { data: existing } = await supabase
        .from('rewards')
        .select('id')
        .eq('customer_id', customerId)
        .eq('business_id', businessId)
        .eq('redeemed', false)
        .maybeSingle()

      if (!existing) {
        const redemptionCode = Math.floor(100000 + Math.random() * 900000).toString()
        const { data: created } = await supabase
          .from('rewards')
          .insert({ customer_id: customerId, business_id: businessId, redemption_code: redemptionCode })
          .select('id, redemption_code')
          .single()
        newReward = created as { id: string; redemption_code: string }
      }
    }

    return NextResponse.json({ stampCount: count, newReward })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stamp failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
