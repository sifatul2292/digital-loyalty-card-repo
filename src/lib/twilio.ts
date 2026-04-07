import twilio from 'twilio'

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) throw new Error('Twilio credentials not configured')
  return twilio(accountSid, authToken)
}

export function getVerifyServiceSid() {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID
  if (!sid) throw new Error('TWILIO_VERIFY_SERVICE_SID not configured')
  return sid
}
