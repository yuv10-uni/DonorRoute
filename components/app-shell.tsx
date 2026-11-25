'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot,
  CalendarHeart,
  ClipboardList,
  Droplets,
  LayoutDashboard,
  Menu,
  RotateCcw,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { Logo } from './logo'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/donors', label: 'Donor Directory', icon: Users },
  { href: '/donors/register', label: 'Register Donor', icon: UserPlus },
  { href: '/requests', label: 'Blood Requests', icon: ClipboardList },
  { href: '/drives', label: 'Donation Drives', icon: CalendarHeart },
  { href: '/inventory', label: 'Blood Inventory', icon: Droplets },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { requests } = useStore()
  const pending = requests.filter((r) => r.status === 'pending').length

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/donors' ? pathname === '/donors' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {href === '/requests' && pending > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{pending}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooter() {
  const { resetDemo, error } = useStore()
  return (
    <div className="mt-auto flex flex-col gap-3 border-t pt-4">
      <div className="rounded-lg bg-accent p-3 text-xs text-accent-foreground">
        <p className="font-semibold">Demo workspace</p>
        <p className="mt-0.5 text-muted-foreground">Data is stored in a shared cloud database.</p>
        {error && <p className="mt-1 font-medium text-destructive">Sync problem: {error}</p>}
      </div>
      <button
        type="button"
        onClick={() => {
          if (confirm('Reset all data to the original demo dataset?')) resetDemo()
        }}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Reset demo data
      </button>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-4 lg:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <NavLinks />
        <SidebarFooter />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-muted">
          <Menu className="size-5" />
          <span className="sr-only">Open navigation</span>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar p-4 shadow-xl animate-in slide-in-from-left">
            <div className="mb-6 flex items-center justify-between px-2">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="size-5" />
                <span className="sr-only">Close navigation</span>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
