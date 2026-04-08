import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QrCode, Download, ExternalLink } from 'lucide-react'
import CopyLinkButton from '@/components/CopyLinkButton'

export default async function QRPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, reward_name, reward_threshold')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/dashboard/settings')

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const joinUrl = `${appUrl}/card/${business.id}`

  // QR code via free API — no package needed
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=20&data=${encodeURIComponent(joinUrl)}`

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
        <p className="text-gray-500 text-sm mt-1">
          Print this and place it at your counter so customers can scan to join.
        </p>
      </div>

      {/* QR Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header band */}
        <div className="bg-indigo-600 px-6 py-5 text-white text-center">
          <div className="text-lg font-bold">{business.name}</div>
          <div className="text-indigo-200 text-sm mt-0.5">
            Collect {business.reward_threshold} stamps · Earn a free {business.reward_name}
          </div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center py-8 px-6">
          <div className="bg-white border-4 border-gray-100 rounded-2xl p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt={`QR code for ${business.name} loyalty program`}
              width={240}
              height={240}
              className="block"
            />
          </div>
          <p className="text-gray-400 text-xs mt-4 text-center">Scan to join the loyalty program</p>
        </div>

        {/* URL + actions */}
        <div className="border-t border-gray-50 px-6 py-4 space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xs text-gray-500 font-mono truncate flex-1">{joinUrl}</span>
            <CopyLinkButton url={joinUrl} />
          </div>

          <div className="flex gap-3">
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Preview page
            </a>
            <a
              href={qrUrl}
              download={`${business.name}-qr.png`}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </a>
          </div>
        </div>
      </div>

      {/* Print tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
        <div className="flex items-start gap-3">
          <QrCode className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-amber-800">Printing tips</div>
            <ul className="text-xs text-amber-700 mt-1.5 space-y-1 list-disc list-inside">
              <li>Download the PNG and print at 10×10 cm or larger for easy scanning</li>
              <li>Place at the counter, on tables, or stick to the door</li>
              <li>The QR links directly to your customer card page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
