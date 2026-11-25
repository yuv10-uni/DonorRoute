'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, CalendarHeart, ClipboardList, Droplets, HeartPulse, Users } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge, BloodBadge, Card, PageHeader, ProgressBar, statusTone, urgencyTone } from '@/components/kit'
import { useStore } from '@/lib/store'
import { formatDate, isEligible, stockLevel, totalUnits } from '@/lib/blood'
import { BLOOD_GROUPS } from '@/lib/types'
import { cn } from '@/lib/utils'

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string | number
  hint: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  )
}

function useMonthlyDonations() {
  const { donations } = useStore()
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1))
    const key = d.toISOString().slice(0, 7)
    return {
      key,
      label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      count: donations.filter((x) => x.date.startsWith(key)).reduce((s, x) => s + x.units, 0),
    }
  })
}

export function DashboardView() {
  const { donors, requests, donations, inventory, drives } = useStore()
  const months = useMonthlyDonations()
  const max = Math.max(...months.map((m) => m.count), 1)
  const thisMonth = months[months.length - 1].count
  const lastMonth = months[months.length - 2].count

  const available = donors.filter((d) => d.available && isEligible(d)).length
  const open = requests.filter((r) => !['fulfilled', 'cancelled'].includes(r.status))
  const critical = open.filter((r) => r.urgency === 'critical')
  const lowStock = BLOOD_GROUPS.filter((g) => ['critical', 'low'].includes(stockLevel(inventory[g].units, inventory[g].capacity)))
  const upcoming = drives.filter((d) => d.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date))

  const byGroup = BLOOD_GROUPS.map((g) => ({ g, n: donors.filter((d) => d.bloodGroup === g).length }))
  const maxGroup = Math.max(...byGroup.map((x) => x.n), 1)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of donors, requests and donation activity across the network."
        actions={
          <>
            <Link href="/donors/register" className={buttonVariants({ variant: 'outline' })}>
              Register donor
            </Link>
            <Link href="/requests?new=1" className={buttonVariants()}>
              New blood request
            </Link>
          </>
        }
      />

      {(critical.length > 0 || lowStock.length > 0) && (
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <p className="flex-1">
            <strong>{critical.length} critical request{critical.length === 1 ? '' : 's'}</strong> open
            {lowStock.length > 0 && (
              <>
                {' · '}low stock in <strong>{lowStock.join(', ')}</strong>
              </>
            )}
          </p>
          <Link href="/assistant" className="font-medium underline underline-offset-4">
            Ask AI for a plan
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total donors" value={donors.length} hint={`${available} available & eligible now`} icon={Users} />
        <StatCard label="Active requests" value={open.length} hint={`${critical.length} critical`} icon={ClipboardList} />
        <StatCard label="Units in stock" value={totalUnits(inventory)} hint={`${lowStock.length} groups need restock`} icon={Droplets} />
        <StatCard
          label="Donations this month"
          value={thisMonth}
          hint={`${thisMonth >= lastMonth ? '+' : ''}${thisMonth - lastMonth} vs last month`}
          icon={HeartPulse}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Donations per month</h2>
            <span className="text-xs text-muted-foreground">{donations.length} total records</span>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3" role="img" aria-label={`Donations per month: ${months.map((m) => `${m.label} ${m.count}`).join(', ')}`}>
            {months.map((m, i) => (
              <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-medium">{m.count}</span>
                <div
                  className={cn('w-full max-w-14 rounded-t-md', i === months.length - 1 ? 'bg-primary' : 'bg-primary/25')}
                  style={{ height: `${(m.count / max) * 80}%`, minHeight: 4 }}
                />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Donors by blood group</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {byGroup.map(({ g, n }) => (
              <li key={g} className="flex items-center gap-3 text-sm">
                <span className="w-9 font-mono font-semibold text-primary">{g}</span>
                <ProgressBar value={(n / maxGroup) * 100} className="flex-1" />
                <span className="w-6 text-right tabular-nums text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="font-semibold">Recent blood requests</h2>
            <Link href="/requests" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="divide-y">
            {requests.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <BloodBadge group={r.bloodGroup} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.patientName} <span className="font-normal text-muted-foreground">· {r.units} units</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.hospital}, {r.city}
                  </p>
                </div>
                <Badge tone={urgencyTone[r.urgency]} className="hidden sm:inline-flex">
                  {r.urgency}
                </Badge>
                <Badge tone={statusTone[r.status]}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="font-semibold">Upcoming drives</h2>
            <CalendarHeart className="size-4 text-primary" aria-hidden="true" />
          </div>
          <ul className="divide-y">
            {upcoming.slice(0, 4).map((d) => (
              <li key={d.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <Badge tone={d.status === 'ongoing' ? 'green' : 'blue'}>{d.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(d.date)} · {d.city}
                </p>
                <ProgressBar value={(d.collectedUnits / d.targetUnits) * 100} className="mt-2 h-1.5" />
              </li>
            ))}
            {upcoming.length === 0 && <li className="px-5 py-6 text-sm text-muted-foreground">No upcoming drives.</li>}
          </ul>
        </Card>
      </div>
    </>
  )
}
