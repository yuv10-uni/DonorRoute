'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { HeartPulse, Search, Trash2, UserPlus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge, BloodBadge, Card, EmptyState, Input, PageHeader, Select, Toast } from '@/components/kit'
import { useStore } from '@/lib/store'
import { formatDate, isEligible, nextEligibleDate } from '@/lib/blood'
import { BLOOD_GROUPS } from '@/lib/types'
import { CITIES } from '@/lib/demo-data'

export function DonorDirectory() {
  const { donors, updateDonor, deleteDonor, recordDonation } = useStore()
  const params = useSearchParams()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState('all')
  const [toast, setToast] = useState<string | null>(params.get('registered') ? 'Donor registered successfully.' : null)
  const clearToast = useCallback(() => setToast(null), [])

  const cities = useMemo(() => Array.from(new Set([...CITIES, ...donors.map((d) => d.city)])).sort(), [donors])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return donors.filter((d) => {
      if (q && ![d.name, d.email, d.phone, d.id, d.city].some((v) => v.toLowerCase().includes(q))) return false
      if (group !== 'all' && d.bloodGroup !== group) return false
      if (city !== 'all' && d.city !== city) return false
      if (status === 'eligible' && !(d.available && isEligible(d))) return false
      if (status === 'unavailable' && d.available) return false
      if (status === 'cooldown' && isEligible(d)) return false
      return true
    })
  }, [donors, query, group, city, status])

  return (
    <>
      <PageHeader
        title="Donor Directory"
        description={`${donors.length} registered donors · ${filtered.length} shown`}
        actions={
          <Link href="/donors/register" className={buttonVariants()}>
            <UserPlus data-icon="inline-start" />
            Register donor
          </Link>
        }
      />

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Search donors"
            placeholder="Search name, email, phone or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select aria-label="Filter by blood group" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">All blood groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
        <Select aria-label="Filter by city" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="eligible">Ready to donate</option>
          <option value="cooldown">In cooldown</option>
          <option value="unavailable">Unavailable</option>
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No donors match your filters" description="Try clearing the search or changing filters." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Donor</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Last donation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((d) => {
                  const eligible = isEligible(d)
                  return (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.id} · {d.age} yrs · {d.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <BloodBadge group={d.bloodGroup} />
                      </td>
                      <td className="px-4 py-3">{d.city}</td>
                      <td className="px-4 py-3">
                        <p>{formatDate(d.lastDonation)}</p>
                        <p className="text-xs text-muted-foreground">{d.totalDonations} total</p>
                      </td>
                      <td className="px-4 py-3">
                        {!d.available ? (
                          <Badge>Unavailable</Badge>
                        ) : eligible ? (
                          <Badge tone="green">Ready</Badge>
                        ) : (
                          <Badge tone="amber" title={`Eligible from ${formatDate(nextEligibleDate(d))}`}>
                            Cooldown
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!eligible || !d.available}
                            onClick={() => {
                              recordDonation(d.id)
                              setToast(`Donation recorded for ${d.name}. +1 unit ${d.bloodGroup}.`)
                            }}
                          >
                            <HeartPulse data-icon="inline-start" />
                            Record donation
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => updateDonor(d.id, { available: !d.available })}>
                            {d.available ? 'Set unavailable' : 'Set available'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              if (confirm(`Remove ${d.name} from the directory?`)) deleteDonor(d.id)
                            }}
                          >
                            <Trash2 className="text-muted-foreground" />
                            <span className="sr-only">Remove {d.name}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
