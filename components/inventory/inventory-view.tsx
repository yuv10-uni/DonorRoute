'use client'

import { useCallback, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, PageHeader, ProgressBar, Select, Toast, stockTone } from '@/components/kit'
import { useStore } from '@/lib/store'
import { CAN_DONATE_TO, CAN_RECEIVE_FROM, stockLevel, totalUnits } from '@/lib/blood'
import { BLOOD_GROUPS, type BloodGroup } from '@/lib/types'
import { cn } from '@/lib/utils'

const barColor = { critical: 'bg-primary', low: 'bg-warning', adequate: 'bg-sky-500', healthy: 'bg-success' }

export function InventoryView() {
  const { inventory, requests, adjustInventory } = useStore()
  const [group, setGroup] = useState<BloodGroup>('O+')
  const [units, setUnits] = useState('1')
  const [action, setAction] = useState<'add' | 'remove'>('add')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  const demand = (g: BloodGroup) =>
    requests.filter((r) => r.bloodGroup === g && !['fulfilled', 'cancelled'].includes(r.status)).reduce((s, r) => s + r.units, 0)

  const total = totalUnits(inventory)
  const capacity = BLOOD_GROUPS.reduce((s, g) => s + inventory[g].capacity, 0)

  return (
    <>
      <PageHeader title="Blood Inventory" description={`${total} units across all 8 blood groups · ${Math.round((total / capacity) * 100)}% of capacity`} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BLOOD_GROUPS.map((g) => {
            const { units: u, capacity: c } = inventory[g]
            const level = stockLevel(u, c)
            const pending = demand(g)
            return (
              <li key={g}>
                <Card className={cn('flex h-full flex-col p-5', level === 'critical' && 'border-red-200')}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-primary">{g}</span>
                    <Badge tone={stockTone[level]}>{level}</Badge>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums">
                    {u}
                    <span className="text-sm font-normal text-muted-foreground"> / {c} units</span>
                  </p>
                  <ProgressBar value={(u / c) * 100} className="mt-3" barClassName={barColor[level]} />
                  <p className={cn('mt-2 text-xs', pending > u ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                    {pending} units in open requests
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <Button variant="outline" size="icon-sm" onClick={() => adjustInventory(g, -1)} disabled={u === 0}>
                      <Minus />
                      <span className="sr-only">Remove one unit of {g}</span>
                    </Button>
                    <span className="text-xs text-muted-foreground">Adjust</span>
                    <Button variant="outline" size="icon-sm" onClick={() => adjustInventory(g, 1)} disabled={u >= c}>
                      <Plus />
                      <span className="sr-only">Add one unit of {g}</span>
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>

        <Card className="h-fit p-5">
          <h2 className="font-semibold">Update stock</h2>
          <form
            className="mt-4 flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              const n = Number(units)
              if (!Number.isInteger(n) || n < 1) return setError('Enter a whole number of units.')
              const { units: current, capacity: cap } = inventory[group]
              if (action === 'remove' && n > current) return setError(`Only ${current} units of ${group} available.`)
              if (action === 'add' && current + n > cap) return setError(`Exceeds ${group} capacity of ${cap} units.`)
              adjustInventory(group, action === 'add' ? n : -n)
              setToast(`${action === 'add' ? 'Added' : 'Removed'} ${n} unit${n > 1 ? 's' : ''} of ${group}.`)
              setUnits('1')
              setError('')
            }}
          >
            <Field label="Blood group" htmlFor="inv-group">
              <Select id="inv-group" value={group} onChange={(e) => setGroup(e.target.value as BloodGroup)}>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Action" htmlFor="inv-action">
              <Select id="inv-action" value={action} onChange={(e) => setAction(e.target.value as 'add' | 'remove')}>
                <option value="add">Add units (received)</option>
                <option value="remove">Remove units (issued / expired)</option>
              </Select>
            </Field>
            <Field label="Units" htmlFor="inv-units" error={error}>
              <Input id="inv-units" type="number" min={1} value={units} onChange={(e) => { setUnits(e.target.value); setError('') }} aria-invalid={!!error} />
            </Field>
            <Button type="submit">Update inventory</Button>
          </form>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-semibold">Blood compatibility chart</h2>
          <p className="mt-1 text-sm text-muted-foreground">Red-cell compatibility used by DonorRoute matching.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Group</th>
                <th className="px-5 py-3 font-medium">Can donate to</th>
                <th className="px-5 py-3 font-medium">Can receive from</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {BLOOD_GROUPS.map((g) => (
                <tr key={g}>
                  <td className="px-5 py-3 font-mono font-bold text-primary">{g}</td>
                  <td className="px-5 py-3">{CAN_DONATE_TO[g].join(', ')}</td>
                  <td className="px-5 py-3">{CAN_RECEIVE_FROM[g].join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
