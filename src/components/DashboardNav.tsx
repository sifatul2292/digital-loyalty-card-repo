'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Stamp, Users, Gift, LayoutDashboard, Settings, LogOut } from 'lucide-react'
import type { Business } from '@/lib/supabase/types'

interface Props {
  business: Business | null
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/stamp', label: 'Give Stamp', icon: Stamp },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Gift },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardNav({ business }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + business name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Stamp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-none">
                {business?.name ?? 'StampLoop'}
              </div>
              {business && (
                <div className="text-xs text-gray-400 leading-none mt-0.5">{business.type}</div>
              )}
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
