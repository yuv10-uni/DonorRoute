'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { demoData } from './demo-data'
import { today, uid } from './blood'
import type { AppData, BloodGroup, BloodRequest, Donor, Drive, RequestStatus } from './types'

interface StoreValue extends AppData {
  /** true once the first load from the API has finished (successfully or not) */
  hydrated: boolean
  /** last sync error, or null. Cleared on the next successful request. */
  error: string | null
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

async function request(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    cache: 'no-store',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.json().then((j) => j?.error).catch(() => null)
    throw new Error(msg || `Request failed (${res.status})`)
  }
  return res
}

const rid = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 899999)}`

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(demoData)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await request('GET', '/api/data')
      setData((await res.json()) as AppData)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the server')
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * Optimistic update: the UI changes immediately, the request runs in the background,
   * and if it fails we show the error and reload the true state from the server.
   */
  const sync = useCallback(
    (method: string, url: string, body?: unknown) => {
      request(method, url, body)
        .then(() => setError(null))
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Sync failed')
          refresh()
        })
    },
    [refresh],
  )

  const adjust = (inv: AppData['inventory'], group: BloodGroup, delta: number) => ({
    ...inv,
    [group]: { ...inv[group], units: Math.max(0, inv[group].units + delta) },
  })

  const addDonor = useCallback<StoreValue['addDonor']>(
    (d) => {
      const donor: Donor = {
        ...d,
        id: rid('DNR'),
        registeredAt: today(),
        totalDonations: d.lastDonation ? 1 : 0,
      }
      setData((s) => ({ ...s, donors: [donor, ...s.donors] }))
      sync('POST', '/api/donors', donor)
      return donor
    },
    [sync],
  )

  const updateDonor = useCallback<StoreValue['updateDonor']>(
    (id, patch) => {
      setData((s) => ({ ...s, donors: s.donors.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
      sync('PATCH', `/api/donors/${encodeURIComponent(id)}`, patch)
    },
    [sync],
  )

  const deleteDonor = useCallback(
    (id: string) => {
      setData((s) => ({ ...s, donors: s.donors.filter((d) => d.id !== id) }))
      sync('DELETE', `/api/donors/${encodeURIComponent(id)}`)
    },
    [sync],
  )

  const recordDonation = useCallback(
    (donorId: string, location = 'DonorRoute Center') => {
      const id = uid('DON')
      const date = today()
      setData((s) => {
        const donor = s.donors.find((d) => d.id === donorId)
        if (!donor) return s
        return {
          ...s,
          donors: s.donors.map((d) =>
            d.id === donorId ? { ...d, lastDonation: date, totalDonations: d.totalDonations + 1 } : d,
          ),
          donations: [
            { id, donorId, donorName: donor.name, bloodGroup: donor.bloodGroup, units: 1, date, location },
            ...s.donations,
          ],
          inventory: adjust(s.inventory, donor.bloodGroup, 1),
        }
      })
      sync('POST', '/api/donations', { id, donorId, date, location })
    },
    [sync],
  )

  const addRequest = useCallback<StoreValue['addRequest']>(
    (r) => {
      const req: BloodRequest = { ...r, id: rid('REQ'), createdAt: today(), status: 'pending' }
      setData((s) => ({ ...s, requests: [req, ...s.requests] }))
      sync('POST', '/api/requests', req)
      return req
    },
    [sync],
  )

  const updateRequestStatus = useCallback(
    (id: string, status: RequestStatus) => {
      setData((s) => {
        const req = s.requests.find((r) => r.id === id)
        if (!req) return s
        const inventory =
          status === 'fulfilled' && req.status !== 'fulfilled'
            ? adjust(s.inventory, req.bloodGroup, -req.units)
            : s.inventory
        return { ...s, inventory, requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) }
      })
      sync('PATCH', `/api/requests/${encodeURIComponent(id)}`, { status })
    },
    [sync],
  )

  const addDrive = useCallback<StoreValue['addDrive']>(
    (d) => {
      const drive: Drive = { ...d, id: rid('DRV'), collectedUnits: 0, registeredDonors: 0, status: 'upcoming' }
      setData((s) => ({ ...s, drives: [drive, ...s.drives] }))
      sync('POST', '/api/drives', drive)
    },
    [sync],
  )

  const updateDrive = useCallback(
    (id: string, patch: Partial<Drive>) => {
      setData((s) => ({ ...s, drives: s.drives.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
      sync('PATCH', `/api/drives/${encodeURIComponent(id)}`, patch)
    },
    [sync],
  )

  const deleteDrive = useCallback(
    (id: string) => {
      setData((s) => ({ ...s, drives: s.drives.filter((d) => d.id !== id) }))
      sync('DELETE', `/api/drives/${encodeURIComponent(id)}`)
    },
    [sync],
  )

  const adjustInventory = useCallback(
    (group: BloodGroup, delta: number) => {
      setData((s) => ({ ...s, inventory: adjust(s.inventory, group, delta) }))
      sync('PATCH', '/api/inventory', { group, delta })
    },
    [sync],
  )

  const resetDemo = useCallback(() => {
    setData(demoData)
    request('POST', '/api/reset')
      .then(refresh)
      .catch((e) => setError(e instanceof Error ? e.message : 'Reset failed'))
  }, [refresh])

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      hydrated,
      error,
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
    [data, hydrated, error, addDonor, updateDonor, deleteDonor, recordDonation, addRequest, updateRequestStatus, addDrive, updateDrive, deleteDrive, adjustInventory, resetDemo],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
