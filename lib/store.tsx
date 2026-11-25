'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { demoData } from './demo-data'
import { today, uid } from './blood'
import type { AppData, BloodGroup, BloodRequest, Donor, Drive, RequestStatus } from './types'

const STORAGE_KEY = 'donorroute:data:v1'

interface StoreValue extends AppData {
  hydrated: boolean
  addDonor: (d: Omit<Donor, 'id' | 'registeredAt' | 'totalDonations'>) => Donor
  updateDonor: (id: string, patch: Partial<Donor>) => void
  deleteDonor: (id: string) => void
  recordDonation: (donorId: string, location?: string) => void
  addRequest: (r: Omit<BloodRequest, 'id' | 'createdAt' | 'status'>) => BloodRequest
  updateRequestStatus: (id: string, status: RequestStatus) => void
  addDrive: (d: Omit<Drive, 'id' | 'collectedUnits' | 'registeredDonors' | 'status'>) => void
  updateDrive: (id: string, patch: Partial<Drive>) => void
  deleteDrive: (id: string) => void
  adjustInventory: (group: BloodGroup, delta: number) => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(demoData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setData(JSON.parse(raw) as AppData)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, hydrated])

  const adjust = (inv: AppData['inventory'], group: BloodGroup, delta: number) => ({
    ...inv,
    [group]: { ...inv[group], units: Math.max(0, inv[group].units + delta) },
  })

  const addDonor = useCallback<StoreValue['addDonor']>((d) => {
    const donor: Donor = {
      ...d,
      id: `DNR-${Math.floor(2000 + Math.random() * 7999)}`,
      registeredAt: today(),
      totalDonations: d.lastDonation ? 1 : 0,
    }
    setData((s) => ({ ...s, donors: [donor, ...s.donors] }))
    return donor
  }, [])

  const updateDonor = useCallback<StoreValue['updateDonor']>((id, patch) => {
    setData((s) => ({ ...s, donors: s.donors.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
  }, [])

  const deleteDonor = useCallback((id: string) => {
    setData((s) => ({ ...s, donors: s.donors.filter((d) => d.id !== id) }))
  }, [])

  const recordDonation = useCallback((donorId: string, location = 'DonorRoute Center') => {
    setData((s) => {
      const donor = s.donors.find((d) => d.id === donorId)
      if (!donor) return s
      const date = today()
      return {
        ...s,
        donors: s.donors.map((d) =>
          d.id === donorId ? { ...d, lastDonation: date, totalDonations: d.totalDonations + 1 } : d,
        ),
        donations: [
          { id: uid('DON'), donorId, donorName: donor.name, bloodGroup: donor.bloodGroup, units: 1, date, location },
          ...s.donations,
        ],
        inventory: adjust(s.inventory, donor.bloodGroup, 1),
      }
    })
  }, [])

  const addRequest = useCallback<StoreValue['addRequest']>((r) => {
    const request: BloodRequest = {
      ...r,
      id: `REQ-${Math.floor(3000 + Math.random() * 6999)}`,
      createdAt: today(),
      status: 'pending',
    }
    setData((s) => ({ ...s, requests: [request, ...s.requests] }))
    return request
  }, [])

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setData((s) => {
      const req = s.requests.find((r) => r.id === id)
      if (!req) return s
      const inventory =
        status === 'fulfilled' && req.status !== 'fulfilled'
          ? adjust(s.inventory, req.bloodGroup, -req.units)
          : s.inventory
      return { ...s, inventory, requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) }
    })
  }, [])

  const addDrive = useCallback<StoreValue['addDrive']>((d) => {
    const drive: Drive = { ...d, id: uid('DRV'), collectedUnits: 0, registeredDonors: 0, status: 'upcoming' }
    setData((s) => ({ ...s, drives: [drive, ...s.drives] }))
  }, [])

  const updateDrive = useCallback((id: string, patch: Partial<Drive>) => {
    setData((s) => ({ ...s, drives: s.drives.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
  }, [])

  const deleteDrive = useCallback((id: string) => {
    setData((s) => ({ ...s, drives: s.drives.filter((d) => d.id !== id) }))
  }, [])

  const adjustInventory = useCallback((group: BloodGroup, delta: number) => {
    setData((s) => ({ ...s, inventory: adjust(s.inventory, group, delta) }))
  }, [])

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setData(demoData)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      addDonor,
      updateDonor,
      deleteDonor,
      recordDonation,
      addRequest,
      updateRequestStatus,
      addDrive,
      updateDrive,
      deleteDrive,
      adjustInventory,
      resetDemo,
    }),
    [data, hydrated, addDonor, updateDonor, deleteDonor, recordDonation, addRequest, updateRequestStatus, addDrive, updateDrive, deleteDrive, adjustInventory, resetDemo],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
