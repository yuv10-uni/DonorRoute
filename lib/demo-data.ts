import type { AppData, BloodGroup, Donation, Donor } from './types'

export const CITIES = ['Boston', 'Chicago', 'Austin', 'Seattle', 'Denver', 'Atlanta']

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seeded(42)
const BASE = Date.UTC(2026, 10, 24)
const daysAgo = (d: number) => new Date(BASE - d * 86_400_000).toISOString().slice(0, 10)
const daysAhead = (d: number) => new Date(BASE + d * 86_400_000).toISOString().slice(0, 10)

const WEIGHTED_GROUPS: BloodGroup[] = [
  'O+', 'O+', 'O+', 'A+', 'A+', 'A+', 'B+', 'B+', 'O-', 'A-', 'AB+', 'B-', 'AB-',
]

const NAMES: [string, Donor['gender']][] = [
  ['Olivia Bennett', 'Female'], ['Marcus Hale', 'Male'], ['Priya Raman', 'Female'], ['Daniel Ortiz', 'Male'],
  ['Hannah Kim', 'Female'], ['Samuel Okafor', 'Male'], ['Grace Liu', 'Female'], ['Ethan Brooks', 'Male'],
  ['Amara Diallo', 'Female'], ['Lucas Moreau', 'Male'], ['Sofia Rossi', 'Female'], ['Noah Patel', 'Male'],
  ['Chloe Martin', 'Female'], ['Jamal Wright', 'Male'], ['Isabel Cruz', 'Female'], ['Ryan Walsh', 'Male'],
  ['Mei Tanaka', 'Female'], ['Omar Haddad', 'Male'], ['Leah Goldberg', 'Female'], ['Victor Nguyen', 'Male'],
  ['Zoe Andersen', 'Female'], ['Kofi Mensah', 'Male'], ['Ava Thompson', 'Female'], ['Alex Rivera', 'Other'],
]

const donors: Donor[] = NAMES.map(([name, gender], i) => {
  const neverDonated = rand() < 0.12
  const [first, last] = name.toLowerCase().split(' ')
  return {
    id: `DNR-${1001 + i}`,
    name,
    email: `${first}.${last}@mail.com`,
    phone: `+1 (555) ${String(200 + Math.floor(rand() * 700)).padStart(3, '0')}-${String(1000 + Math.floor(rand() * 8999))}`,
    bloodGroup: WEIGHTED_GROUPS[Math.floor(rand() * WEIGHTED_GROUPS.length)],
    age: 19 + Math.floor(rand() * 42),
    gender,
    city: CITIES[Math.floor(rand() * CITIES.length)],
    lastDonation: neverDonated ? null : daysAgo(10 + Math.floor(rand() * 240)),
    totalDonations: neverDonated ? 0 : 1 + Math.floor(rand() * 14),
    available: rand() > 0.18,
    registeredAt: daysAgo(30 + Math.floor(rand() * 600)),
  }
})

const LOCATIONS = ['City General Hospital', 'Red Cross Center', 'Community Drive', 'University Campus Drive', 'St. Mary Blood Bank']

const donations: Donation[] = Array.from({ length: 96 }, (_, i) => {
  const donor = donors[Math.floor(rand() * donors.length)]
  return {
    id: `DON-${5001 + i}`,
    donorId: donor.id,
    donorName: donor.name,
    bloodGroup: donor.bloodGroup,
    units: 1,
    date: daysAgo(Math.floor(rand() * 178)),
    location: LOCATIONS[Math.floor(rand() * LOCATIONS.length)],
  }
}).sort((a, b) => b.date.localeCompare(a.date))

export const demoData: AppData = {
  donors,
  donations,
  inventory: {
    'A+': { units: 84, capacity: 120 },
    'A-': { units: 14, capacity: 50 },
    'B+': { units: 62, capacity: 100 },
    'B-': { units: 9, capacity: 40 },
    'AB+': { units: 31, capacity: 60 },
    'AB-': { units: 6, capacity: 30 },
    'O+': { units: 108, capacity: 150 },
    'O-': { units: 17, capacity: 80 },
  },
  requests: [
    { id: 'REQ-2041', patientName: 'James Carter', hospital: 'City General Hospital', city: 'Boston', bloodGroup: 'O-', units: 4, urgency: 'critical', contact: '+1 (555) 410-2231', status: 'pending', createdAt: daysAgo(0), neededBy: daysAhead(1), notes: 'Trauma case, emergency surgery scheduled.' },
    { id: 'REQ-2040', patientName: 'Maria Lopez', hospital: 'Northside Medical Center', city: 'Chicago', bloodGroup: 'A+', units: 2, urgency: 'high', contact: '+1 (555) 320-8812', status: 'matched', createdAt: daysAgo(1), neededBy: daysAhead(2), notes: 'Post-operative transfusion.' },
    { id: 'REQ-2039', patientName: 'Ethan Wallace', hospital: "St. Luke's Hospital", city: 'Austin', bloodGroup: 'B-', units: 3, urgency: 'critical', contact: '+1 (555) 778-1045', status: 'in-transit', createdAt: daysAgo(1), neededBy: daysAhead(0), notes: 'Thalassemia patient.' },
    { id: 'REQ-2038', patientName: 'Aisha Rahman', hospital: 'Seattle Children’s', city: 'Seattle', bloodGroup: 'AB+', units: 1, urgency: 'normal', contact: '+1 (555) 210-6634', status: 'pending', createdAt: daysAgo(2), neededBy: daysAhead(5), notes: '' },
    { id: 'REQ-2037', patientName: 'Robert Chen', hospital: 'Denver Health', city: 'Denver', bloodGroup: 'O+', units: 5, urgency: 'high', contact: '+1 (555) 902-4471', status: 'pending', createdAt: daysAgo(2), neededBy: daysAhead(3), notes: 'Scheduled cardiac surgery.' },
    { id: 'REQ-2036', patientName: 'Fatima Noor', hospital: 'Emory University Hospital', city: 'Atlanta', bloodGroup: 'A-', units: 2, urgency: 'normal', contact: '+1 (555) 655-3318', status: 'fulfilled', createdAt: daysAgo(4), neededBy: daysAgo(1), notes: '' },
    { id: 'REQ-2035', patientName: 'William Grant', hospital: 'City General Hospital', city: 'Boston', bloodGroup: 'B+', units: 2, urgency: 'normal', contact: '+1 (555) 233-9087', status: 'fulfilled', createdAt: daysAgo(6), neededBy: daysAgo(3), notes: '' },
    { id: 'REQ-2034', patientName: 'Nina Petrova', hospital: 'Northside Medical Center', city: 'Chicago', bloodGroup: 'AB-', units: 1, urgency: 'high', contact: '+1 (555) 501-7764', status: 'cancelled', createdAt: daysAgo(8), neededBy: daysAgo(5), notes: 'Patient transferred.' },
  ],
  drives: [
    { id: 'DRV-301', title: 'Winter Lifeline Drive', organizer: 'Red Cross Boston', location: 'Copley Square Pavilion', city: 'Boston', date: daysAhead(4), startTime: '09:00', endTime: '16:00', targetUnits: 150, collectedUnits: 0, registeredDonors: 96, status: 'upcoming' },
    { id: 'DRV-302', title: 'Campus Heroes Blood Camp', organizer: 'UT Austin Student Health', location: 'Student Union Ballroom', city: 'Austin', date: daysAgo(0), startTime: '10:00', endTime: '17:00', targetUnits: 120, collectedUnits: 58, registeredDonors: 110, status: 'ongoing' },
    { id: 'DRV-303', title: 'Tech Gives Back', organizer: 'Seattle Tech Alliance', location: 'South Lake Union Hub', city: 'Seattle', date: daysAhead(11), startTime: '08:30', endTime: '15:30', targetUnits: 200, collectedUnits: 0, registeredDonors: 74, status: 'upcoming' },
    { id: 'DRV-304', title: 'Mile High Donor Day', organizer: 'Denver Health Foundation', location: 'Civic Center Park', city: 'Denver', date: daysAgo(9), startTime: '09:00', endTime: '14:00', targetUnits: 100, collectedUnits: 112, registeredDonors: 128, status: 'completed' },
    { id: 'DRV-305', title: 'Community Care Drive', organizer: 'Atlanta Rotary Club', location: 'Piedmont Park Center', city: 'Atlanta', date: daysAgo(21), startTime: '10:00', endTime: '16:00', targetUnits: 80, collectedUnits: 67, registeredDonors: 85, status: 'completed' },
  ],
}
