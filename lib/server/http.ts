import { ready } from './db'
import { BLOOD_GROUPS, type BloodGroup } from '../types'

export const bad = (message: string, status = 400) => Response.json({ error: message }, { status })

/** Runs a route body after the DB is ready, turning exceptions into JSON 500s. */
export async function handle(fn: () => Promise<Response>) {
  try {
    await ready()
    return await fn()
  } catch (e) {
    console.error('[api]', e)
    return bad('Server error', 500)
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export const isGroup = (v: unknown): v is BloodGroup => BLOOD_GROUPS.includes(v as BloodGroup)
export const isStr = (v: unknown, max = 300): v is string => typeof v === 'string' && v.length <= max
export const isInt = (v: unknown, min = 0, max = 1_000_000): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max
export const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
