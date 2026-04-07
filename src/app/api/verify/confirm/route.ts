import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTwilioClient, getVerifyServiceSid } from '@/lib/twilio'

export async function POST(request: Request) {
  try {
    const { phone, code, businessId, name } = await request.json()

    if (!phone || !code || !businessId) {
      return NextResponse.json({ error: 'Phone, code and businessId are required' }, { status: 400 })
    }

    const cleaned = phone.replace(/\D/g, '')
    const formatted = phone.trim().startsWith('+') ? phone.trim() : `+${cleaned}`

    // Verify OTP via Twilio
    const client = getTwilioClient()
    const serviceSid = getVerifyServiceSid()

    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: formatted, code })

    if (check.status !== 'approved') {
      return NextResponse.json({ error: 'Incorrect code — please try again.' }, { status: 400 })
    }

    // Find or create customer (uses service role to bypass RLS)
    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from('customers')
      .select('id, name, card_token')
      .eq('phone', cleaned)
      .eq('business_id', businessId)
      .single()

    let customer: { id: string; name: string; card_token: string }
    let isNew = false

    if (existing) {
      customer = existing
    } else {
      isNew = true
      const { data: created, error: createError } = await supabase
        .from('customers')
        .insert({
          phone: cleaned,
          name: name?.trim() || 'Customer',
          business_id: businessId,
        })
        .select('id, name, card_token')
        .single()

      if (createError || !created) {
        return NextResponse.json({ error: createError?.message || 'Could not create card' }, { status: 500 })
      }
      customer = created
    }

    // Fetch stamps + rewards
    const [stampsRes, rewardsRes] = await Promise.all([
      supabase
        .from('stamps')
        .select('id, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('rewards')
        .select('id, redeemed, redemption_code, created_at')
        .eq('customer_id', customer.id)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      customer: { ...customer, isNew },
      stamps: stampsRes.data ?? [],
      rewards: rewardsRes.data ?? [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
