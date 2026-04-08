import { Megaphone, Zap, Mail, Gift, Bell } from 'lucide-react'

const planned = [
  {
    icon: Gift,
    title: 'Double Stamp Days',
    description: 'Set specific days where customers earn 2× stamps per visit.',
    tag: 'Coming soon',
  },
  {
    icon: Bell,
    title: 'Win-Back SMS',
    description: "Automatically text customers who haven't visited in 30+ days with a special offer.",
    tag: 'Coming soon',
  },
  {
    icon: Mail,
    title: 'Birthday Rewards',
    description: 'Send a free reward or bonus stamps to customers on their birthday.',
    tag: 'Coming soon',
  },
  {
    icon: Zap,
    title: 'Referral Bonus',
    description: 'Give existing customers bonus stamps for referring a friend who joins.',
    tag: 'Coming soon',
  },
]

export default function CampaignsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-500 text-sm mt-1">
          Automated marketing tools to grow your loyalty program.
        </p>
      </div>

      {/* Hero placeholder */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-8 text-center text-white">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">Campaigns are coming soon</h2>
        <p className="text-indigo-200 text-sm max-w-sm mx-auto">
          We&apos;re building powerful tools to help you re-engage customers and grow visits automatically.
        </p>
      </div>

      {/* Planned features */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">What&apos;s planned</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {planned.map(({ icon: Icon, title, description, tag }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {tag}
                </span>
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">{title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
