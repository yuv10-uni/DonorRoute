'use client'

import Link from 'next/link'
import { ArrowRight, Bot, CalendarHeart, ClipboardList, Droplets, Route, Users } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { stockLevel, totalUnits } from '@/lib/blood'
import { BLOOD_GROUPS } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PlatformStats() {
  const { donors, requests, donations, inventory, drives } = useStore()
  const stats = [
    { label: 'Registered donors', value: donors.length.toLocaleString() },
    { label: 'Units in stock', value: totalUnits(inventory).toLocaleString() },
    { label: 'Donations (6 mo)', value: donations.length.toLocaleString() },
    { label: 'Requests fulfilled', value: requests.filter((r) => r.status === 'fulfilled').length.toString() },
    { label: 'Donation drives', value: drives.length.toString() },
  ]
  return (
    <section aria-label="Platform statistics" className="border-b bg-background">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 py-10 sm:px-6 md:grid-cols-5 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 p-4">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="text-3xl font-semibold tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const FEATURES = [
  { icon: Route, title: 'Smart donor matching', body: 'Ranks compatible, eligible donors by blood type, distance and donation history.' },
  { icon: ClipboardList, title: 'Request tracking', body: 'Follow each request from pending to matched, in transit and fulfilled.' },
  { icon: Droplets, title: 'Live inventory', body: 'Stock levels for all 8 blood groups with automatic low-stock alerts.' },
  { icon: CalendarHeart, title: 'Drive management', body: 'Plan donation drives, register donors and log collected units.' },
  { icon: Users, title: 'Donor directory', body: 'Searchable donor records with availability and eligibility status.' },
  { icon: Bot, title: 'AI assistant', body: 'Ask about stock, compatibility, eligibility or which donors to contact.' },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">Platform</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything a blood network needs, in one place
        </h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function InventoryStrip() {
  const { inventory } = useStore()
  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Inventory</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Current stock by blood group</h2>
          </div>
          <Link href="/inventory" className={buttonVariants({ variant: 'outline' })}>
            View inventory
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BLOOD_GROUPS.map((g) => {
            const level = stockLevel(inventory[g].units, inventory[g].capacity)
            return (
              <li key={g} className="rounded-xl border bg-background p-4 text-center">
                <p className="font-mono text-xl font-bold text-primary">{g}</p>
                <p className="mt-1 text-2xl font-semibold">{inventory[g].units}</p>
                <p
                  className={cn(
                    'mt-1 text-xs font-medium capitalize',
                    level === 'critical' ? 'text-primary' : level === 'low' ? 'text-warning' : 'text-muted-foreground',
                  )}
                >
                  {level}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function CallToAction() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-8 py-12 text-primary-foreground md:flex-row md:items-center">
        <div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight">One donation can save up to three lives.</h2>
          <p className="mt-2 text-primary-foreground/80">Register in under a minute and get notified when you are needed.</p>
        </div>
        <Link
          href="/donors/register"
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-11 bg-background px-5 text-primary')}
        >
          Register as donor
          <ArrowRight data-icon="inline-end" />
        </Link>
      </div>
    </section>
  )
}
