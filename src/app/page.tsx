import Link from 'next/link'
import { Stamp, Star, Bell, BarChart3, CheckCircle, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Stamp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">StampLoop</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
            No app download required for customers
          </span>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Digital loyalty cards<br />your customers will{' '}
            <span className="text-indigo-600">actually use</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Replace paper punch cards with a beautiful digital loyalty system. Give stamps via phone lookup, let customers check their card online, and watch repeat visits soar.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center gap-2"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">Free to start · No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">
            Everything you need to retain customers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Stamp className="w-6 h-6 text-indigo-600" />,
                title: 'One-tap stamps',
                desc: 'Search a customer by phone number and give a stamp in seconds. No hardware needed.',
              },
              {
                icon: <Star className="w-6 h-6 text-indigo-600" />,
                title: 'Automatic rewards',
                desc: 'When a customer hits their stamp goal, a reward is created automatically. Redeem with one click.',
              },
              {
                icon: <Bell className="w-6 h-6 text-indigo-600" />,
                title: 'Win-back alerts',
                desc: "Enable win-back mode to get notified when loyal customers haven't visited in a while.",
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
                title: 'Visit analytics',
                desc: 'See stamp trends, top customers, and reward redemption rates at a glance.',
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-indigo-600" />,
                title: 'Digital loyalty card',
                desc: 'Each customer gets a unique card URL they can bookmark — no app download needed.',
              },
              {
                icon: <ArrowRight className="w-6 h-6 text-indigo-600" />,
                title: 'Multi-business ready',
                desc: 'Manage multiple locations or concepts from a single StampLoop account.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-14">Up and running in 2 minutes</h2>
          <div className="space-y-6 text-left">
            {[
              { step: '1', title: 'Create your business profile', desc: 'Set your business name, type, reward threshold, and what the reward is.' },
              { step: '2', title: 'Add customers by phone', desc: 'Type in a phone number and name. Customers get a unique card link they can bookmark.' },
              { step: '3', title: 'Give stamps after each visit', desc: 'Search the customer and tap "Give Stamp". When they hit the goal, a reward is issued automatically.' },
              { step: '4', title: 'Redeem rewards easily', desc: 'When a customer claims their reward, mark it redeemed with one click.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to keep customers coming back?</h2>
          <p className="text-indigo-200 mb-8">Join local businesses already using StampLoop to build loyal regulars.</p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Stamp className="w-4 h-4 text-white" />
            </div>
            <span>StampLoop</span>
          </div>
          <span>© {new Date().getFullYear()} StampLoop. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
