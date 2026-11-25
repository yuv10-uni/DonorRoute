'use client'

import { useCallback, useMemo, useState } from 'react'
import { CalendarDays, Clock, MapPin, Plus, Search, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, EmptyState, Field, Input, Modal, PageHeader, ProgressBar, Select, Toast } from '@/components/kit'
import { useStore } from '@/lib/store'
import { formatDate, today } from '@/lib/blood'
import type { Drive, DriveStatus } from '@/lib/types'
import { CITIES } from '@/lib/demo-data'

const statusTone = { upcoming: 'blue', ongoing: 'green', completed: 'gray' } as const

const emptyDrive = { title: '', organizer: '', location: '', city: '', date: '', startTime: '09:00', endTime: '16:00', targetUnits: '100' }

function DriveForm({ onSubmit }: { onSubmit: (d: Omit<Drive, 'id' | 'collectedUnits' | 'registeredDonors' | 'status'>) => void }) {
  const [form, setForm] = useState(emptyDrive)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof emptyDrive, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (form.title.trim().length < 3) errs.title = 'Enter a drive title.'
        if (!form.organizer.trim()) errs.organizer = 'Enter the organizer.'
        if (!form.location.trim()) errs.location = 'Enter a venue.'
        if (!form.city.trim()) errs.city = 'Enter a city.'
        if (!form.date) errs.date = 'Select a date.'
        else if (form.date < today()) errs.date = 'Date cannot be in the past.'
        if (form.endTime <= form.startTime) errs.endTime = 'End time must be after start time.'
        const target = Number(form.targetUnits)
        if (!Number.isInteger(target) || target < 10) errs.targetUnits = 'Target must be at least 10 units.'
        setErrors(errs)
        if (Object.values(errs).some(Boolean)) return
        onSubmit({ ...form, title: form.title.trim(), targetUnits: target })
        setForm(emptyDrive)
      }}
    >
      <Field label="Drive title" htmlFor="title" error={errors.title} className="sm:col-span-2">
        <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} />
      </Field>
      <Field label="Organizer" htmlFor="organizer" error={errors.organizer}>
        <Input id="organizer" value={form.organizer} onChange={(e) => set('organizer', e.target.value)} aria-invalid={!!errors.organizer} />
      </Field>
      <Field label="Venue" htmlFor="location" error={errors.location}>
        <Input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} aria-invalid={!!errors.location} />
      </Field>
      <Field label="City" htmlFor="drive-city" error={errors.city}>
        <Input id="drive-city" list="drive-city-options" value={form.city} onChange={(e) => set('city', e.target.value)} aria-invalid={!!errors.city} />
        <datalist id="drive-city-options">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Date" htmlFor="date" error={errors.date}>
        <Input id="date" type="date" min={today()} value={form.date} onChange={(e) => set('date', e.target.value)} aria-invalid={!!errors.date} />
      </Field>
      <Field label="Start time" htmlFor="startTime">
        <Input id="startTime" type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
      </Field>
      <Field label="End time" htmlFor="endTime" error={errors.endTime}>
        <Input id="endTime" type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} aria-invalid={!!errors.endTime} />
      </Field>
      <Field label="Target units" htmlFor="targetUnits" error={errors.targetUnits}>
        <Input id="targetUnits" type="number" min={10} value={form.targetUnits} onChange={(e) => set('targetUnits', e.target.value)} aria-invalid={!!errors.targetUnits} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full">Create drive</Button>
      </div>
    </form>
  )
}

function LogUnits({ drive, onLog }: { drive: Drive; onLog: (n: number) => void }) {
  const [value, setValue] = useState('')
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const n = Number(value)
        if (!Number.isInteger(n) || n < 1) return
        onLog(n)
        setValue('')
      }}
    >
      <Input
        aria-label={`Units collected at ${drive.title}`}
        type="number"
        min={1}
        placeholder="Units"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-24"
      />
      <Button type="submit" size="sm" variant="outline" className="h-8">
        Log units
      </Button>
    </form>
  )
}

export function DrivesView() {
  const { drives, addDrive, updateDrive, deleteDrive, adjustInventory } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | DriveStatus>('all')
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const close = useCallback(() => setOpen(false), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return drives
      .filter((d) => (status === 'all' || d.status === status) && [d.title, d.organizer, d.city, d.location].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [drives, query, status])

  const totals = {
    upcoming: drives.filter((d) => d.status === 'upcoming').length,
    collected: drives.reduce((s, d) => s + d.collectedUnits, 0),
    donors: drives.reduce((s, d) => s + d.registeredDonors, 0),
  }

  return (
    <>
      <PageHeader
        title="Donation Drives"
        description="Plan blood donation drives, register donors and log collections."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            New drive
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ['Upcoming drives', totals.upcoming],
          ['Units collected', totals.collected],
          ['Registered donors', totals.donors],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search drives" placeholder="Search title, organizer or city" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Filter by status">
          {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1 text-sm capitalize ${status === s ? 'bg-background font-medium shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No drives found" description="Create a new drive to get started." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => {
            const pct = (d.collectedUnits / d.targetUnits) * 100
            return (
              <li key={d.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{d.title}</h2>
                      <p className="text-sm text-muted-foreground">{d.organizer}</p>
                    </div>
                    <Badge tone={statusTone[d.status]}>{d.status}</Badge>
                  </div>
                  <ul className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />{formatDate(d.date)}</li>
                    <li className="flex items-center gap-2"><Clock className="size-4" aria-hidden="true" />{d.startTime} – {d.endTime}</li>
                    <li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" />{d.location}, {d.city}</li>
                    <li className="flex items-center gap-2"><Users className="size-4" aria-hidden="true" />{d.registeredDonors} donors registered</li>
                  </ul>
                  <div className="mb-5 mt-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">Collected</span>
                      <span className="font-medium">{d.collectedUnits} / {d.targetUnits} units</span>
                    </div>
                    <ProgressBar value={pct} barClassName={pct >= 100 ? 'bg-success' : undefined} />
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
                    {d.status !== 'completed' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateDrive(d.id, { registeredDonors: d.registeredDonors + 1 })}>
                          + Donor
                        </Button>
                        {d.status === 'upcoming' ? (
                          <Button size="sm" onClick={() => { updateDrive(d.id, { status: 'ongoing' }); setToast(`${d.title} started.`) }}>
                            Start drive
                          </Button>
                        ) : (
                          <>
                            <LogUnits
                              drive={d}
                              onLog={(n) => {
                                updateDrive(d.id, { collectedUnits: d.collectedUnits + n })
                                adjustInventory('O+', Math.round(n * 0.38))
                                adjustInventory('A+', Math.round(n * 0.34))
                                adjustInventory('B+', Math.round(n * 0.18))
                                adjustInventory('O-', n - Math.round(n * 0.38) - Math.round(n * 0.34) - Math.round(n * 0.18))
                                setToast(`${n} units logged and added to inventory.`)
                              }}
                            />
                            <Button size="sm" onClick={() => { updateDrive(d.id, { status: 'completed' }); setToast(`${d.title} completed.`) }}>
                              Complete
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => {
                        if (confirm(`Delete ${d.title}?`)) deleteDrive(d.id)
                      }}
                    >
                      <Trash2 className="text-muted-foreground" />
                      <span className="sr-only">Delete {d.title}</span>
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={open} onClose={close} title="Create donation drive" className="max-w-2xl">
        <DriveForm
          onSubmit={(d) => {
            addDrive(d)
            close()
            setToast('Donation drive created.')
          }}
        />
      </Modal>
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
