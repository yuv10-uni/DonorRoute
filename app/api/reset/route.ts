import { seed } from '@/lib/server/db'
import { handle } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

export const POST = () =>
  handle(async () => {
    await seed()
    return Response.json({ ok: true })
  })
