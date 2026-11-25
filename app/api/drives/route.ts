import { q } from '@/lib/server/db'
import { bad, handle, isDate, isInt, isStr, readJson } from '@/lib/server/http'
import type { Drive } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const POST = (req: Request) =>
  handle(async () => {
    const b = await readJson(req)
    if (
      !b || !isStr(b.id, 40) || !isStr(b.title, 200) || !isStr(b.organizer, 200) || !isStr(b.location, 200) ||
      !isStr(b.city, 120) || !isDate(b.date) || !isStr(b.startTime, 10) || !isStr(b.endTime, 10) ||
      !isInt(b.targetUnits, 1, 100_000)
    ) return bad('Invalid drive')
    try {
      await q.insertDrive({ ...(b as unknown as Drive), collectedUnits: 0, registeredDonors: 0, status: 'upcoming' })
    } catch (e) {
      if ((e as { code?: string }).code === '23505') return bad('Drive id already exists', 409)
      throw e
    }
    return Response.json({ ok: true }, { status: 201 })
  })
