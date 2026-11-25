'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/kit'
import { useStore } from '@/lib/store'
import { today } from '@/lib/blood'
import { BLOOD_GROUPS, type BloodGroup, type BloodRequest, type Urgency } from '@/lib/types'
import { CITIES } from '@/lib/demo-data'

const initial = {
  patientName: '',
  hospital: '',
  city: '',
  bloodGroup: '' as BloodGroup | '',
  units: '1',
  urgency: 'normal' as Urgency,
  contact: '',
  neededBy: '',
  notes: '',
}

export function RequestForm({ onCreated }: { onCreated: (r: BloodRequest) => void }) {
  const { addRequest } = useStore()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof typeof initial, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (form.patientName.trim().length < 2) errs.patientName = 'Enter the patient name.'
    if (form.hospital.trim().length < 2) errs.hospital = 'Enter the hospital.'
    if (!form.city.trim()) errs.city = 'Enter a city.'
    if (!form.bloodGroup) errs.bloodGroup = 'Select a blood group.'
    const units = Number(form.units)
    if (!Number.isInteger(units) || units < 1 || units > 20) errs.units = 'Units must be between 1 and 20.'
    if (form.contact.replace(/\D/g, '').length < 10) errs.contact = 'Enter a valid contact number.'
    if (!form.neededBy) errs.neededBy = 'Select the date needed.'
    else if (form.neededBy < today()) errs.neededBy = 'Date cannot be in the past.'
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const created = addRequest({
      patientName: form.patientName.trim(),
      hospital: form.hospital.trim(),
      city: form.city.trim(),
      bloodGroup: form.bloodGroup as BloodGroup,
      units,
      urgency: form.urgency,
      contact: form.contact.trim(),
      neededBy: form.neededBy,
      notes: form.notes.trim(),
    })
    setForm(initial)
    onCreated(created)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Patient name" htmlFor="patientName" error={errors.patientName}>
        <Input id="patientName" value={form.patientName} onChange={(e) => set('patientName', e.target.value)} aria-invalid={!!errors.patientName} />
      </Field>
      <Field label="Hospital" htmlFor="hospital" error={errors.hospital}>
        <Input id="hospital" value={form.hospital} onChange={(e) => set('hospital', e.target.value)} aria-invalid={!!errors.hospital} />
      </Field>
      <Field label="City" htmlFor="req-city" error={errors.city}>
        <Input id="req-city" list="req-city-options" value={form.city} onChange={(e) => set('city', e.target.value)} aria-invalid={!!errors.city} />
        <datalist id="req-city-options">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Contact number" htmlFor="contact" error={errors.contact}>
        <Input id="contact" type="tel" value={form.contact} onChange={(e) => set('contact', e.target.value)} aria-invalid={!!errors.contact} />
      </Field>
      <Field label="Blood group" htmlFor="req-group" error={errors.bloodGroup}>
        <Select id="req-group" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} aria-invalid={!!errors.bloodGroup}>
          <option value="">Select group</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </Field>
      <Field label="Units required" htmlFor="units" error={errors.units}>
        <Input id="units" type="number" min={1} max={20} value={form.units} onChange={(e) => set('units', e.target.value)} aria-invalid={!!errors.units} />
      </Field>
      <Field label="Urgency" htmlFor="urgency">
        <Select id="urgency" value={form.urgency} onChange={(e) => set('urgency', e.target.value)}>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </Field>
      <Field label="Needed by" htmlFor="neededBy" error={errors.neededBy}>
        <Input id="neededBy" type="date" min={today()} value={form.neededBy} onChange={(e) => set('neededBy', e.target.value)} aria-invalid={!!errors.neededBy} />
      </Field>
      <Field label="Notes (optional)" htmlFor="notes" className="sm:col-span-2">
        <Textarea id="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Diagnosis, special requirements…" />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full">Submit request</Button>
      </div>
    </form>
  )
}
