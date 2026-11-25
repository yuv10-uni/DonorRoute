export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export type BloodGroup = (typeof BLOOD_GROUPS)[number]

export interface Donor {
  id: string
  name: string
  email: string
  phone: string
  bloodGroup: BloodGroup
  age: number
  gender: 'Male' | 'Female' | 'Other'
  city: string
  lastDonation: string | null
  totalDonations: number
  available: boolean
  registeredAt: string
}

export type Urgency = 'critical' | 'high' | 'normal'
export type RequestStatus = 'pending' | 'matched' | 'in-transit' | 'fulfilled' | 'cancelled'

export interface BloodRequest {
  id: string
  patientName: string
  hospital: string
  city: string
  bloodGroup: BloodGroup
  units: number
  urgency: Urgency
  contact: string
  status: RequestStatus
  createdAt: string
  neededBy: string
  notes: string
}

export type DriveStatus = 'upcoming' | 'ongoing' | 'completed'

export interface Drive {
  id: string
  title: string
  organizer: string
  location: string
  city: string
  date: string
  startTime: string
  endTime: string
  targetUnits: number
  collectedUnits: number
  registeredDonors: number
  status: DriveStatus
}

export interface Donation {
  id: string
  donorId: string
  donorName: string
  bloodGroup: BloodGroup
  units: number
  date: string
  location: string
}

export type Inventory = Record<BloodGroup, { units: number; capacity: number }>

export interface AppData {
  donors: Donor[]
  requests: BloodRequest[]
  drives: Drive[]
  donations: Donation[]
  inventory: Inventory
}
