import { db, q } from '@/lib/server/db'
import { bad, handle, readJson } from '@/lib/server/http'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

const STATUSES = ['pending', 'matched', 'in-transit', 'fulfilled', 'cancelled']

/** Updates a request's status. Moving to "fulfilled" deducts the units from inventory (once). */
export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const { id } = await params
    const b = await readJson(req)
    if (!b || !STATUSES.includes(b.status as string)) return bad('Invalid status')
    const sql = db()
    const rows = await sql`SELECT blood_group, units, status FROM requests WHERE id = ${id}`
    const cur = rows[0]
    if (!cur) return bad('Not found', 404)
    const stmts = [sql`UPDATE requests SET status = ${b.status as string} WHERE id = ${id}`]
    if (b.status === 'fulfilled' && cur.status !== 'fulfilled') stmts.push(q.adjustInventory(cur.blood_group, -cur.units))
    await sql.transaction(stmts)
    return Response.json({ ok: true })
  })
