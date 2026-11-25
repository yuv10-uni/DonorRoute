import { db, getDonor, q } from '@/lib/server/db'
import { bad, handle, isDate, isStr, readJson } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

/** Records a donation: inserts the donation, updates the donor, and adds 1 unit to inventory atomically. */
export const POST = (req: Request) =>
  handle(async () => {
    const b = await readJson(req)
    if (!b || !isStr(b.id, 40) || !isStr(b.donorId, 40) || !isDate(b.date) || !isStr(b.location, 200))
      return bad('Invalid donation')
    const donor = await getDonor(b.donorId)
    if (!donor) return bad('Donor not found', 404)
    const sql = db()
    await sql.transaction([
      sql`UPDATE donors SET last_donation = ${b.date}, total_donations = total_donations + 1 WHERE id = ${donor.id}`,
      q.insertDonation({
        id: b.id, donorId: donor.id, donorName: donor.name, bloodGroup: donor.bloodGroup,
        units: 1, date: b.date, location: b.location,
      }),
      q.adjustInventory(donor.bloodGroup, 1),
    ])
    return Response.json({ ok: true }, { status: 201 })
  })
