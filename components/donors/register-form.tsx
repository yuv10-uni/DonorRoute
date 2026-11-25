'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, Field, Input, PageHeader, Select } from '@/components/kit'
import { useStore } from '@/lib/store'
import { CAN_DONATE_TO, today } from '@/lib/blood'
import { BLOOD_GROUPS, type BloodGroup, type Donor } from '@/lib/types'
import { CITIES } from '@/lib/demo-data'

const initial = {
  name: '',
  email: '',
  phone: '',
  bloodGroup: '' as BloodGroup | '',
  age: '',
  gender: 'Female' as Donor['gender'],
  city: '',
  lastDonation: '',
  available: true,
  consent: false,
}

type Errors = Partial<Record<keyof typeof initial, string>>

function validate(f: typeof initial): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Enter the full name.'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.'
  if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number (10+ digits).'
  if (!f.bloodGroup) e.bloodGroup = 'Select a blood group.'
  const age = Number(f.age)
  if (!age || age < 18 || age > 65) e.age = 'Donors must be between 18 and 65 years old.'
  if (!f.city.trim()) e.city = 'Enter a city.'
  if (f.lastDonation && f.lastDonation > today()) e.lastDonation = 'Date cannot be in the future.'
  if (!f.consent) e.consent = 'Consent is required to register.'
  return e
}

export function RegisterForm() {
  const { addDonor } = useStore()
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})

  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    addDonor({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      bloodGroup: form.bloodGroup as BloodGroup,
      age: Number(form.age),
      gender: form.gender,
      city: form.city.trim(),
      lastDonation: form.lastDonation || null,
      available: form.available,
    })
    router.push('/donors?registered=1')
  }

  return (
    <>
      <PageHeader title="Register Donor" description="Add a new blood donor to the DonorRoute network." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} autoComplete="tel" placeholder="+1 (555) 000-0000" />
            </Field>
            <Field label="Blood group" htmlFor="bloodGroup" error={errors.bloodGroup}>
              <Select id="bloodGroup" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value as BloodGroup)} aria-invalid={!!errors.bloodGroup}>
                <option value="">Select group</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Age" htmlFor="age" error={errors.age}>
              <Input id="age" type="number" min={18} max={65} value={form.age} onChange={(e) => set('age', e.target.value)} aria-invalid={!!errors.age} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <Select id="gender" value={form.gender} onChange={(e) => set('gender', e.target.value as Donor['gender'])}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="City" htmlFor="city" error={errors.city}>
              <Input id="city" list="city-options" value={form.city} onChange={(e) => set('city', e.target.value)} aria-invalid={!!errors.city} autoComplete="address-level2" />
              <datalist id="city-options">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Last donation date (optional)" htmlFor="lastDonation" error={errors.lastDonation}>
              <Input id="lastDonation" type="date" max={today()} value={form.lastDonation} onChange={(e) => set('lastDonation', e.target.value)} />
            </Field>
            <div className="flex items-center gap-2 self-end pb-2">
              <input id="available" type="checkbox" checked={form.available} onChange={(e) => set('available', e.target.checked)} className="size-4 accent-primary" />
              <label htmlFor="available" className="text-sm">Available for emergency requests</label>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-start gap-2">
                <input id="consent" type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 size-4 accent-primary" aria-invalid={!!errors.consent} />
                <label htmlFor="consent" className="text-sm text-muted-foreground">
                  I confirm I am in good health, weigh at least 110 lbs, and consent to being contacted for blood donation.
                </label>
              </div>
              {errors.consent && <p className="mt-1 text-xs text-destructive" role="alert">{errors.consent}</p>}
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" size="lg" className="px-5">Register donor</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => { setForm(initial); setErrors({}) }}>
                Clear
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="font-semibold">Eligibility checklist</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {['Aged 18–65 years', 'Weight of 110 lbs (50 kg) or more', '56 days since last whole-blood donation', 'No fever, cold or infection in past 2 weeks'].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
          {form.bloodGroup && (
            <Card className="p-5">
              <h2 className="font-semibold">
                <span className="text-primary">{form.bloodGroup}</span> can donate to
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {CAN_DONATE_TO[form.bloodGroup].map((g) => (
                  <span key={g} className="rounded-md bg-accent px-2 py-1 font-mono text-xs font-semibold text-primary">{g}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
