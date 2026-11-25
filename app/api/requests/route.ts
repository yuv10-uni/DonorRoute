import { q } from '@/lib/server/db'
import { bad, handle, isDate, isGroup, isInt, isStr, readJson } from '@/lib/server/http'
import type { BloodRequest } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const POST = (req: Request) =>
  handle(async () => {
    const b = await readJson(req)
    if (
      !b || !isStr(b.id, 40) || !isStr(b.patientName, 120) || !isStr(b.hospital, 200) || !isStr(b.city, 120) ||
      !isGroup(b.bloodGroup) || !isInt(b.units, 1, 1000) || !['critical', 'high', 'normal'].includes(b.urgency as string) ||
      !isStr(b.contact, 60) || !isDate(b.createdAt) || !isDate(b.neededBy) || !isStr(b.notes, 1000)
    ) return bad('Invalid request')
    try {
      await q.insertRequest({ ...(b as unknown as BloodRequest), status: 'pending' })
    } catch (e) {
      if ((e as { code?: string }).code === '23505') return bad('Request id already exists', 409)
      throw e
    }
    return Response.json({ ok: true }, { status: 201 })
  })
