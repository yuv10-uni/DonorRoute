'use client'

import Link from 'next/link'
import { Activity, ArrowRight, MapPin, ShieldCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { BloodBadge, Badge, urgencyTone } from '@/components/kit'
import { useStore } from '@/lib/store'
import { matchDonors } from '@/lib/blood'
import { cn } from '@/lib/utils'

export function Hero() {
  const { requests, donors } = useStore()
  const live = requests.filter((r) => r.status === 'pending' || r.status === 'matched').slice(0, 3)

  return (
    <section className="relative overflow-hidden border-b bg-card">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <Badge tone="red" className="normal-case">
            <Activity className="size-3" aria-hidden="true" />
            AI-powered blood logistics
          </Badge>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Every unit routed to the <span className="text-primary">right patient</span>, right on time.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            DonorRoute connects donors, hospitals and blood banks on one platform. Match compatible donors in seconds,
            track every request and keep all eight blood groups stocked.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5')}>
              Open dashboard
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link href="/donors/register" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-5')}>
              Become a donor
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Compatibility rules and donor eligibility checked automatically
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Live request routing</p>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
              Live
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {live.map((r) => {
              const matches = matchDonors(donors, r.bloodGroup, r.city)
              return (
                <li key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <BloodBadge group={r.bloodGroup} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.hospital}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" aria-hidden="true" />
                        {r.city} · {r.units} units
                      </p>
                    </div>
                    <Badge tone={urgencyTone[r.urgency]}>{r.urgency}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                    <span className="text-muted-foreground">AI matched donors</span>
                    <span className="font-semibold text-foreground">
                      {matches.length} compatible
                      {matches[0] && ` · top score ${matches[0].score}%`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
