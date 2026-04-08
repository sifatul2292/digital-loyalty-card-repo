'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Stamp, Megaphone,
  QrCode, Settings, LogOut, ExternalLink,
} from 'lucide-react'

interface Props {
  business: { id: string; name: string; type: string } | null
}

const navItems = [
  { href: '/dashboard',            label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/customers',  label: 'Customers',    icon: Users,           exact: false },
  { href: '/dashboard/campaigns',  label: 'Campaigns',    icon: Megaphone,       exact: false },
  { href: '/dashboard/qr',         label: 'QR Code',      icon: QrCode,          exact: false },
  { href: '/dashboard/settings',   label: 'Settings',     icon: Settings,        exact: false },
]

export default function Sidebar({ business }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
            <Stamp className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate leading-none">
              {business?.name ?? 'StampLoop'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{business?.type ?? 'Loyalty'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} style={{ width: 18, height: 18 }} />
                {label}
              </Link>
            )
          })}

          {/* Stamp Screen — opens in new tab */}
          {business && (
            <a
              href={`/stamp/${business.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <Stamp className="text-gray-400" style={{ width: 18, height: 18 }} />
              Stamp Screen
              <ExternalLink className="w-3 h-3 text-gray-300 ml-auto" />
            </a>
          )}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut style={{ width: 18, height: 18 }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-b">
        {[...navItems.slice(0, 4), { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false }].map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon style={{ width: 20, height: 20 }} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
