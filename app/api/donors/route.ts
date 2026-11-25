import { q } from '@/lib/server/db'
import { bad, handle, isDate, isGroup, isInt, isStr, readJson } from '@/lib/server/http'
import type { Donor } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const POST = (req: Request) =>
  handle(async () => {
    const b = await readJson(req)
    if (
      !b || !isStr(b.id, 40) || !isStr(b.name, 120) || !isStr(b.email, 200) || !isStr(b.phone, 40) ||
      !isGroup(b.bloodGroup) || !isInt(b.age, 0, 120) || !['Male', 'Female', 'Other'].includes(b.gender as string) ||
      !isStr(b.city, 120) || !(b.lastDonation === null || isDate(b.lastDonation)) ||
      !isInt(b.totalDonations) || typeof b.available !== 'boolean' || !isDate(b.registeredAt)
    ) return bad('Invalid donor')
    try {
      await q.insertDonor(b as unknown as Donor)
    } catch (e) {
      if ((e as { code?: string }).code === '23505') return bad('Donor id already exists', 409)
      throw e
    }
    return Response.json({ ok: true }, { status: 201 })
  })
