import { q } from '@/lib/server/db'
import { bad, handle, isGroup, isInt, readJson } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

export const PATCH = (req: Request) =>
  handle(async () => {
    const b = await readJson(req)
    if (!b || !isGroup(b.group) || !isInt(b.delta, -10_000, 10_000)) return bad('Invalid adjustment')
    await q.adjustInventory(b.group, b.delta)
    return Response.json({ ok: true })
  })
