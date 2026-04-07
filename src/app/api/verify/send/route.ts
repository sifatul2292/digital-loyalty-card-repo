import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTwilioClient, getVerifyServiceSid } from '@/lib/twilio'

export async function POST(request: Request) {
  try {
    const { phone, businessId } = await request.json()

    if (!phone || !businessId) {
      return NextResponse.json({ error: 'Phone and businessId are required' }, { status: 400 })
    }

    // Verify business exists
    const supabase = createServiceClient()
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Normalise phone — ensure E.164 format
    const cleaned = phone.replace(/\D/g, '')
    const formatted = phone.trim().startsWith('+') ? phone.trim() : `+${cleaned}`

    const client = getTwilioClient()
    const serviceSid = getVerifyServiceSid()

    await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: formatted, channel: 'sms' })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send code'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
