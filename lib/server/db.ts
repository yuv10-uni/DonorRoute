import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { demoData } from '../demo-data'
import type { AppData, BloodRequest, Donation, Donor, Drive } from '../types'

type Sql = NeonQueryFunction<false, false>

let client: Sql | null = null

/** Lazily create the Neon client so `next build` never needs DATABASE_URL. */
export function db(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    client = neon(url)
  }
  return client
}

/* ------------------------------------------------------------------ */
/* Statement builders (lazy: await them, or pass to sql.transaction)   */
/* ------------------------------------------------------------------ */

export const q = {
  insertDonor: (d: Donor) => db()`
    INSERT INTO donors (id, name, email, phone, blood_group, age, gender, city, last_donation, total_donations, available, registered_at)
    VALUES (${d.id}, ${d.name}, ${d.email}, ${d.phone}, ${d.bloodGroup}, ${d.age}, ${d.gender}, ${d.city},
            ${d.lastDonation}, ${d.totalDonations}, ${d.available}, ${d.registeredAt})`,

  updateDonor: (d: Donor) => db()`
    UPDATE donors SET name=${d.name}, email=${d.email}, phone=${d.phone}, blood_group=${d.bloodGroup}, age=${d.age},
      gender=${d.gender}, city=${d.city}, last_donation=${d.lastDonation}, total_donations=${d.totalDonations},
      available=${d.available}
    WHERE id=${d.id}`,

  insertRequest: (r: BloodRequest) => db()`
    INSERT INTO requests (id, patient_name, hospital, city, blood_group, units, urgency, contact, status, created_at, needed_by, notes)
    VALUES (${r.id}, ${r.patientName}, ${r.hospital}, ${r.city}, ${r.bloodGroup}, ${r.units}, ${r.urgency},
            ${r.contact}, ${r.status}, ${r.createdAt}, ${r.neededBy}, ${r.notes})`,

  insertDrive: (d: Drive) => db()`
    INSERT INTO drives (id, title, organizer, location, city, date, start_time, end_time, target_units, collected_units, registered_donors, status)
    VALUES (${d.id}, ${d.title}, ${d.organizer}, ${d.location}, ${d.city}, ${d.date}, ${d.startTime}, ${d.endTime},
            ${d.targetUnits}, ${d.collectedUnits}, ${d.registeredDonors}, ${d.status})`,

  updateDrive: (d: Drive) => db()`
    UPDATE drives SET title=${d.title}, organizer=${d.organizer}, location=${d.location}, city=${d.city}, date=${d.date},
      start_time=${d.startTime}, end_time=${d.endTime}, target_units=${d.targetUnits},
      collected_units=${d.collectedUnits}, registered_donors=${d.registeredDonors}, status=${d.status}
    WHERE id=${d.id}`,

  insertDonation: (d: Donation) => db()`
    INSERT INTO donations (id, donor_id, donor_name, blood_group, units, date, location)
    VALUES (${d.id}, ${d.donorId}, ${d.donorName}, ${d.bloodGroup}, ${d.units}, ${d.date}, ${d.location})`,

  adjustInventory: (group: string, delta: number) => db()`
    UPDATE inventory SET units = GREATEST(0, units + ${delta}) WHERE blood_group = ${group}`,
}

/* ------------------------------------------------------------------ */
/* Schema + seeding                                                    */
/* ------------------------------------------------------------------ */

async function createSchema() {
  const sql = db()
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY, value text NOT NULL)`,
    sql`CREATE TABLE IF NOT EXISTS donors (
      seq bigserial, id text PRIMARY KEY, name text NOT NULL, email text NOT NULL, phone text NOT NULL,
      blood_group text NOT NULL, age integer NOT NULL, gender text NOT NULL, city text NOT NULL,
      last_donation text, total_donations integer NOT NULL DEFAULT 0, available boolean NOT NULL DEFAULT true,
      registered_at text NOT NULL)`,
    sql`CREATE TABLE IF NOT EXISTS requests (
      seq bigserial, id text PRIMARY KEY, patient_name text NOT NULL, hospital text NOT NULL, city text NOT NULL,
      blood_group text NOT NULL, units integer NOT NULL, urgency text NOT NULL, contact text NOT NULL,
      status text NOT NULL, created_at text NOT NULL, needed_by text NOT NULL, notes text NOT NULL DEFAULT '')`,
    sql`CREATE TABLE IF NOT EXISTS drives (
      seq bigserial, id text PRIMARY KEY, title text NOT NULL, organizer text NOT NULL, location text NOT NULL,
      city text NOT NULL, date text NOT NULL, start_time text NOT NULL, end_time text NOT NULL,
      target_units integer NOT NULL, collected_units integer NOT NULL DEFAULT 0,
      registered_donors integer NOT NULL DEFAULT 0, status text NOT NULL)`,
    sql`CREATE TABLE IF NOT EXISTS donations (
      seq bigserial, id text PRIMARY KEY, donor_id text NOT NULL, donor_name text NOT NULL,
      blood_group text NOT NULL, units integer NOT NULL, date text NOT NULL, location text NOT NULL)`,
    sql`CREATE TABLE IF NOT EXISTS inventory (
      blood_group text PRIMARY KEY, units integer NOT NULL, capacity integer NOT NULL)`,
  ])
}

/** Wipes all data and loads the demo data set. */
export async function seed() {
  const sql = db()
  // Lists are read ORDER BY seq DESC, so insert in reverse to preserve demo order.
  const rev = <T,>(a: T[]) => [...a].reverse()
  await sql.transaction([
    sql`TRUNCATE donors, requests, drives, donations, inventory`,
    ...rev(demoData.donors).map(q.insertDonor),
    ...rev(demoData.requests).map(q.insertRequest),
    ...rev(demoData.drives).map(q.insertDrive),
    ...rev(demoData.donations).map(q.insertDonation),
    ...Object.entries(demoData.inventory).map(
      ([g, v]) => sql`INSERT INTO inventory (blood_group, units, capacity) VALUES (${g}, ${v.units}, ${v.capacity})`,
    ),
    sql`INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT (key) DO NOTHING`,
  ])
}

let readyPromise: Promise<void> | null = null

/** Creates tables and seeds demo data once (first request on a cold instance). */
export function ready() {
  readyPromise ??= (async () => {
    await createSchema()
    const seeded = await db()`SELECT 1 FROM meta WHERE key = 'seeded'`
    if (!seeded.length) await seed()
  })().catch((e) => {
    readyPromise = null
    throw e
  })
  return readyPromise
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function readAll(): Promise<AppData> {
  const sql = db()
  const [donors, requests, drives, donations, inv] = await Promise.all([
    sql`SELECT id, name, email, phone, blood_group AS "bloodGroup", age, gender, city, last_donation AS "lastDonation",
               total_donations AS "totalDonations", available, registered_at AS "registeredAt"
        FROM donors ORDER BY seq DESC`,
    sql`SELECT id, patient_name AS "patientName", hospital, city, blood_group AS "bloodGroup", units, urgency, contact,
               status, created_at AS "createdAt", needed_by AS "neededBy", notes
        FROM requests ORDER BY seq DESC`,
    sql`SELECT id, title, organizer, location, city, date, start_time AS "startTime", end_time AS "endTime",
               target_units AS "targetUnits", collected_units AS "collectedUnits",
               registered_donors AS "registeredDonors", status
        FROM drives ORDER BY seq DESC`,
    sql`SELECT id, donor_id AS "donorId", donor_name AS "donorName", blood_group AS "bloodGroup", units, date, location
        FROM donations ORDER BY seq DESC`,
    sql`SELECT blood_group, units, capacity FROM inventory`,
  ])
  const inventory = Object.fromEntries(
    inv.map((r) => [r.blood_group, { units: r.units, capacity: r.capacity }]),
  ) as AppData['inventory']
  return {
    donors: donors as Donor[],
    requests: requests as BloodRequest[],
    drives: drives as Drive[],
    donations: donations as Donation[],
    inventory,
  }
}

export async function getDonor(id: string) {
  const rows = await db()`
    SELECT id, name, email, phone, blood_group AS "bloodGroup", age, gender, city, last_donation AS "lastDonation",
           total_donations AS "totalDonations", available, registered_at AS "registeredAt"
    FROM donors WHERE id = ${id}`
  return (rows[0] as Donor | undefined) ?? null
}

export async function getDrive(id: string) {
  const rows = await db()`
    SELECT id, title, organizer, location, city, date, start_time AS "startTime", end_time AS "endTime",
           target_units AS "targetUnits", collected_units AS "collectedUnits",
           registered_donors AS "registeredDonors", status
    FROM drives WHERE id = ${id}`
  return (rows[0] as Drive | undefined) ?? null
}
