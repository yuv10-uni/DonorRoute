'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, MapPin, Phone, Plus, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Badge,
  BloodBadge,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Toast,
  statusTone,
  urgencyTone,
} from '@/components/kit'
import { useStore } from '@/lib/store'
import { CAN_RECEIVE_FROM, formatDate, matchDonors } from '@/lib/blood'
import { BLOOD_GROUPS, type BloodRequest, type RequestStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RequestForm } from './request-form'

const FLOW: RequestStatus[] = ['pending', 'matched', 'in-transit', 'fulfilled']
const NEXT_LABEL: Partial<Record<RequestStatus, string>> = {
  pending: 'Mark matched',
  matched: 'Dispatch',
  'in-transit': 'Mark fulfilled',
}

function Tracker({ status }: { status: RequestStatus }) {
  const current = FLOW.indexOf(status)
  return (
    <ol className="flex items-center gap-1" aria-label={`Status: ${status}`}>
      {FLOW.map((step, i) => {
        const done = status !== 'cancelled' && i <= current
        return (
          <li key={step} className="flex flex-1 items-center gap-1">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                done ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <span className={cn('hidden text-xs capitalize sm:inline', done ? 'text-foreground' : 'text-muted-foreground')}>
              {step}
            </span>
            {i < FLOW.length - 1 && <span className={cn('h-px flex-1', done && i < current ? 'bg-primary' : 'bg-border')} />}
          </li>
        )
      })}
    </ol>
  )
}

export function RequestsView() {
  const { requests, donors, inventory, updateRequestStatus } = useStore()
  const params = useSearchParams()
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const [matchFor, setMatchFor] = useState<BloodRequest | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('active')
  const [urgency, setUrgency] = useState('all')
  const [group, setGroup] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const closeForm = useCallback(() => {
    setFormOpen(false)
    if (params.get('new')) router.replace('/requests')
  }, [params, router])
  const closeMatch = useCallback(() => setMatchFor(null), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const order = { critical: 0, high: 1, normal: 2 }
    return requests
      .filter((r) => {
        if (q && ![r.id, r.patientName, r.hospital, r.city].some((v) => v.toLowerCase().includes(q))) return false
        if (status === 'active' && ['fulfilled', 'cancelled'].includes(r.status)) return false
        if (status !== 'active' && status !== 'all' && r.status !== status) return false
        if (urgency !== 'all' && r.urgency !== urgency) return false
        if (group !== 'all' && r.bloodGroup !== group) return false
        return true
      })
      .sort((a, b) => order[a.urgency] - order[b.urgency] || b.createdAt.localeCompare(a.createdAt))
  }, [requests, query, status, urgency, group])

  const matches = matchFor ? matchDonors(donors, matchFor.bloodGroup, matchFor.city) : []
  const stockForMatch = matchFor ? CAN_RECEIVE_FROM[matchFor.bloodGroup].map((g) => ({ g, units: inventory[g].units })) : []

  return (
    <>
      <PageHeader
        title="Blood Requests"
        description="Submit, prioritise and track blood requests from hospitals."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus data-icon="inline-start" />
            New request
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['pending', 'matched', 'in-transit', 'fulfilled'] as RequestStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40',
              status === s && 'border-primary ring-1 ring-primary',
            )}
          >
            <p className="text-xs capitalize text-muted-foreground">{s}</p>
            <p className="mt-1 text-2xl font-semibold">{requests.filter((r) => r.status === s).length}</p>
          </button>
        ))}
      </div>

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search requests" placeholder="Search patient, hospital, city or ID" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active requests</option>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="matched">Matched</option>
          <option value="in-transit">In transit</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select aria-label="Filter by urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
          <option value="all">All urgencies</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
        </Select>
        <Select aria-label="Filter by blood group" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">All groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No requests found" description="Adjust filters or submit a new request." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((r) => {
            const closed = r.status === 'fulfilled' || r.status === 'cancelled'
            const insufficient = r.status === 'in-transit' && inventory[r.bloodGroup].units < r.units
            return (
              <li key={r.id}>
                <Card className={cn('p-5', r.urgency === 'critical' && !closed && 'border-red-200')}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <BloodBadge group={r.bloodGroup} className="h-10 min-w-12 text-sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{r.patientName}</p>
                          <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                          <Badge tone={urgencyTone[r.urgency]}>{r.urgency}</Badge>
                          <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" aria-hidden="true" />
                            {r.hospital}, {r.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="size-3.5" aria-hidden="true" />
                            {r.contact}
                          </span>
                        </p>
                        <p className="mt-1 text-sm">
                          <strong>{r.units} units</strong> · needed by {formatDate(r.neededBy)}
                          <span className="text-muted-foreground"> · requested {formatDate(r.createdAt)}</span>
                        </p>
                        {r.notes && <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {!closed && (
                        <Button variant="outline" size="sm" onClick={() => setMatchFor(r)}>
                          <Sparkles data-icon="inline-start" />
                          AI match
                        </Button>
                      )}
                      {NEXT_LABEL[r.status] && (
                        <Button
                          size="sm"
                          disabled={insufficient}
                          title={insufficient ? 'Not enough units in inventory' : undefined}
                          onClick={() => {
                            const next = FLOW[FLOW.indexOf(r.status) + 1]
                            updateRequestStatus(r.id, next)
                            setToast(`${r.id} updated to ${next}.`)
                          }}
                        >
                          {NEXT_LABEL[r.status]}
                        </Button>
                      )}
                      {!closed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Cancel request ${r.id}?`)) updateRequestStatus(r.id, 'cancelled')
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 border-t pt-4">
                    {r.status === 'cancelled' ? (
                      <p className="text-sm text-muted-foreground">This request was cancelled.</p>
                    ) : (
                      <Tracker status={r.status} />
                    )}
                    {insufficient && (
                      <p className="mt-2 text-xs text-destructive">
                        Only {inventory[r.bloodGroup].units} units of {r.bloodGroup} in stock.
                      </p>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={formOpen} onClose={closeForm} title="New blood request" description="Requests are prioritised by urgency and matched automatically." className="max-w-2xl">
        <RequestForm
          onCreated={(r) => {
            closeForm()
            setStatus('active')
            setToast(`Request ${r.id} submitted.`)
          }}
        />
      </Modal>

      <Modal
        open={!!matchFor}
        onClose={closeMatch}
        title={matchFor ? `AI match for ${matchFor.id}` : ''}
        description={matchFor ? `${matchFor.units} units of ${matchFor.bloodGroup} for ${matchFor.hospital}, ${matchFor.city}` : ''}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-sm font-semibold">Compatible inventory</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {stockForMatch.map(({ g, units }) => (
                <span key={g} className="rounded-md border px-2 py-1 text-xs">
                  <span className="font-mono font-semibold text-primary">{g}</span> · {units} units
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Ranked donors ({matches.length})</h3>
            {matches.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No eligible compatible donors are available right now.</p>
            ) : (
              <ul className="mt-2 divide-y rounded-lg border">
                {matches.slice(0, 6).map(({ donor, score }) => (
                  <li key={donor.id} className="flex items-center gap-3 p-3">
                    <BloodBadge group={donor.bloodGroup} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{donor.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {donor.city} · {donor.phone}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{score}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {matchFor?.status === 'pending' && (
            <Button
              onClick={() => {
                updateRequestStatus(matchFor.id, 'matched')
                setToast(`${matchFor.id} marked as matched.`)
                closeMatch()
              }}
            >
              Confirm match
            </Button>
          )}
        </div>
      </Modal>

      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
