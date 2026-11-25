import type { BloodGroup, Donor, Inventory } from './types'

export const CAN_RECEIVE_FROM: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
}

export const CAN_DONATE_TO: Record<BloodGroup, BloodGroup[]> = Object.fromEntries(
  (Object.keys(CAN_RECEIVE_FROM) as BloodGroup[]).map((donor) => [
    donor,
    (Object.keys(CAN_RECEIVE_FROM) as BloodGroup[]).filter((r) => CAN_RECEIVE_FROM[r].includes(donor)),
  ]),
) as Record<BloodGroup, BloodGroup[]>

export const DONATION_INTERVAL_DAYS = 56
const DAY = 86_400_000

export function daysSince(date: string | null) {
  if (!date) return Infinity
  return Math.floor((Date.now() - new Date(date).getTime()) / DAY)
}

export function isEligible(donor: Donor) {
  return donor.age >= 18 && donor.age <= 65 && daysSince(donor.lastDonation) >= DONATION_INTERVAL_DAYS
}

export function nextEligibleDate(donor: Donor) {
  if (!donor.lastDonation) return null
  return new Date(new Date(donor.lastDonation).getTime() + DONATION_INTERVAL_DAYS * DAY).toISOString().slice(0, 10)
}

export type StockLevel = 'critical' | 'low' | 'adequate' | 'healthy'

export function stockLevel(units: number, capacity: number): StockLevel {
  const ratio = units / capacity
  if (ratio < 0.2) return 'critical'
  if (ratio < 0.4) return 'low'
  if (ratio < 0.75) return 'adequate'
  return 'healthy'
}

export function totalUnits(inventory: Inventory) {
  return Object.values(inventory).reduce((sum, g) => sum + g.units, 0)
}

export function matchDonors(donors: Donor[], group: BloodGroup, city?: string) {
  const compatible = CAN_RECEIVE_FROM[group]
  return donors
    .filter((d) => d.available && isEligible(d) && compatible.includes(d.bloodGroup))
    .map((d) => {
      let score = 50
      if (d.bloodGroup === group) score += 25
      if (city && d.city.toLowerCase() === city.toLowerCase()) score += 20
      score += Math.min(d.totalDonations, 5)
      return { donor: d, score: Math.min(score, 99) }
    })
    .sort((a, b) => b.score - a.score)
}

export function formatDate(date: string | null) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}
