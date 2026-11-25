import { db, getDrive, q } from '@/lib/server/db'
import { bad, handle, isDate, isInt, isStr, readJson } from '@/lib/server/http'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const { id } = await params
    const p = await readJson(req)
    if (!p) return bad('Invalid body')
    const cur = await getDrive(id)
    if (!cur) return bad('Not found', 404)
    const next = { ...cur }
    for (const k of ['title', 'organizer', 'location', 'city', 'startTime', 'endTime'] as const) {
      if (k in p) { if (!isStr(p[k], 200)) return bad(`Invalid ${k}`); next[k] = p[k] as string }
    }
    if ('date' in p) { if (!isDate(p.date)) return bad('Invalid date'); next.date = p.date }
    for (const k of ['targetUnits', 'collectedUnits', 'registeredDonors'] as const) {
      if (k in p) { if (!isInt(p[k], 0, 100_000)) return bad(`Invalid ${k}`); next[k] = p[k] as number }
    }
    if ('status' in p) {
      if (!['upcoming', 'ongoing', 'completed'].includes(p.status as string)) return bad('Invalid status')
      next.status = p.status as typeof next.status
    }
    await q.updateDrive(next)
    return Response.json({ ok: true })
  })

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    const { id } = await params
    await db()`DELETE FROM drives WHERE id = ${id}`
    return Response.json({ ok: true })
  })
