import { readAll } from '@/lib/server/db'
import { handle } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

export const GET = () => handle(async () => Response.json(await readAll(), { headers: { 'Cache-Control': 'no-store' } }))
