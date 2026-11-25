import { db, getDonor, q } from '@/lib/server/db'
import { bad, handle, isDate, isGroup, isInt, isStr, readJson } from '@/lib/server/http'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const { id } = await params
    const p = await readJson(req)
    if (!p) return bad('Invalid body')
    const cur = await getDonor(id)
    if (!cur) return bad('Not found', 404)
    const next = { ...cur }
    if ('name' in p) { if (!isStr(p.name, 120)) return bad('Invalid name'); next.name = p.name }
    if ('email' in p) { if (!isStr(p.email, 200)) return bad('Invalid email'); next.email = p.email }
    if ('phone' in p) { if (!isStr(p.phone, 40)) return bad('Invalid phone'); next.phone = p.phone }
    if ('city' in p) { if (!isStr(p.city, 120)) return bad('Invalid city'); next.city = p.city }
    if ('bloodGroup' in p) { if (!isGroup(p.bloodGroup)) return bad('Invalid blood group'); next.bloodGroup = p.bloodGroup }
    if ('age' in p) { if (!isInt(p.age, 0, 120)) return bad('Invalid age'); next.age = p.age }
    if ('available' in p) { if (typeof p.available !== 'boolean') return bad('Invalid availability'); next.available = p.available }
    if ('lastDonation' in p) {
      if (!(p.lastDonation === null || isDate(p.lastDonation))) return bad('Invalid date')
      next.lastDonation = p.lastDonation as string | null
    }
    await q.updateDonor(next)
    return Response.json({ ok: true })
  })

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    const { id } = await params
    await db()`DELETE FROM donors WHERE id = ${id}`
    return Response.json({ ok: true })
  })
