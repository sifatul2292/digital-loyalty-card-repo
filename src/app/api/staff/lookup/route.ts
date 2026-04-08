import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const { phone, businessId, pin } = await request.json()

    if (!phone || !businessId || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify PIN against business
    const { data: business } = await supabase
      .from('businesses')
      .select('id, staff_pin, reward_threshold, reward_name')
      .eq('id', businessId)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    if (!business.staff_pin) {
      return NextResponse.json({ error: 'Staff PIN not configured — set it in dashboard Settings.' }, { status: 403 })
    }

    if (business.staff_pin !== pin) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
    }

    // Look up customer by phone
    const cleaned = phone.replace(/\D/g, '')
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('phone', cleaned)
      .eq('business_id', businessId)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found. Ask them to register via the join link.' }, { status: 404 })
    }

    // Count stamps since last redemption
    const { data: lastRedemption } = await supabase
      .from('rewards')
      .select('redeemed_at')
      .eq('customer_id', customer.id)
      .eq('business_id', businessId)
      .eq('redeemed', true)
      .not('redeemed_at', 'is', null)
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const stampQuery = supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)
      .eq('business_id', businessId)

    const { count: stampCount } = lastRedemption?.redeemed_at
      ? await stampQuery.gte('created_at', lastRedemption.redeemed_at)
      : await stampQuery

    // Get active pending reward
    const { data: pendingReward } = await supabase
      .from('rewards')
      .select('id, redemption_code')
      .eq('customer_id', customer.id)
      .eq('business_id', businessId)
      .eq('redeemed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      customer,
      stampCount: stampCount ?? 0,
      threshold: business.reward_threshold,
      rewardName: business.reward_name,
      pendingReward: pendingReward ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
