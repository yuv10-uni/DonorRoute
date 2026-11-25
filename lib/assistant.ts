import { CAN_DONATE_TO, CAN_RECEIVE_FROM, DONATION_INTERVAL_DAYS, formatDate, matchDonors, stockLevel, totalUnits } from './blood'
import { BLOOD_GROUPS, type AppData, type BloodGroup } from './types'

const GROUP_RE = /\b(AB|A|B|O)\s*(\+|-|positive|negative|pos|neg)(?=\s|$|[?.,!])/i

function findGroup(text: string): BloodGroup | null {
  const m = text.match(GROUP_RE)
  if (!m) return null
  const sign = m[2].startsWith('+') || m[2].toLowerCase().startsWith('pos') ? '+' : '-'
  const g = `${m[1].toUpperCase()}${sign}` as BloodGroup
  return BLOOD_GROUPS.includes(g) ? g : null
}

function findCity(text: string, data: AppData) {
  const cities = new Set(data.donors.map((d) => d.city))
  return [...cities].find((c) => text.toLowerCase().includes(c.toLowerCase()))
}

export const SUGGESTIONS = [
  'Which blood groups are low in stock?',
  'Find donors for O- in Boston',
  'Who can donate to AB+?',
  'Summarize critical requests',
  'Am I eligible to donate again?',
  'Plan a restock strategy',
]

export function answer(question: string, data: AppData): string {
  const q = question.toLowerCase()
  const group = findGroup(question)
  const city = findCity(question, data)
  const open = data.requests.filter((r) => !['fulfilled', 'cancelled'].includes(r.status))

  if (/\b(hi|hello|hey)\b/.test(q) && q.length < 20) {
    return 'Hello! I am the DonorRoute assistant. Ask me about inventory, donor matching, blood compatibility, open requests, eligibility or donation drives.'
  }

  if (/(find|match|donor|contact|who should)/.test(q) && group && !/(donate to|receive|compatib)/.test(q)) {
    const matches = matchDonors(data.donors, group, city).slice(0, 5)
    if (!matches.length) return `I could not find any eligible, available donors compatible with **${group}**${city ? ` in ${city}` : ''}. Consider broadening the search or scheduling a drive.`
    const lines = matches.map((m, i) => `${i + 1}. **${m.donor.name}** (${m.donor.bloodGroup}, ${m.donor.city}) — ${m.donor.phone} · match score ${m.score}%`)
    return `Top compatible donors for **${group}**${city ? ` near ${city}` : ''}:\n\n${lines.join('\n')}\n\nScores weigh exact-type match, location and donation history. Only donors past the ${DONATION_INTERVAL_DAYS}-day interval are included.`
  }

  if (group && /(donate to|give to)/.test(q)) {
    return `**${group}** can donate red cells to: ${CAN_DONATE_TO[group].join(', ')}.${group === 'O-' ? ' O- is the universal donor.' : ''}`
  }

  if (group && /(receive|compatib|accept)/.test(q)) {
    return `**${group}** patients can receive from: ${CAN_RECEIVE_FROM[group].join(', ')}.${group === 'AB+' ? ' AB+ is the universal recipient.' : ''}\n\nCompatible stock right now: ${CAN_RECEIVE_FROM[group].map((g) => `${g} (${data.inventory[g].units})`).join(', ')}.`
  }

  if (/(low|short|stock|inventory|level|units)/.test(q) && !/restock|plan|strategy/.test(q)) {
    if (group) {
      const { units, capacity } = data.inventory[group]
      return `**${group}** has ${units} of ${capacity} units (${stockLevel(units, capacity)}).`
    }
    const low = BLOOD_GROUPS.filter((g) => ['critical', 'low'].includes(stockLevel(data.inventory[g].units, data.inventory[g].capacity)))
    const lines = BLOOD_GROUPS.map((g) => `- ${g}: ${data.inventory[g].units}/${data.inventory[g].capacity} — ${stockLevel(data.inventory[g].units, data.inventory[g].capacity)}`)
    return `Total stock is **${totalUnits(data.inventory)} units**.${low.length ? ` Groups needing attention: **${low.join(', ')}**.` : ' All groups are adequately stocked.'}\n\n${lines.join('\n')}`
  }

  if (/(restock|plan|strategy|recommend)/.test(q)) {
    const ranked = BLOOD_GROUPS.map((g) => {
      const demand = open.filter((r) => r.bloodGroup === g).reduce((s, r) => s + r.units, 0)
      const { units, capacity } = data.inventory[g]
      return { g, gap: demand + capacity * 0.4 - units, units, demand }
    })
      .filter((x) => x.gap > 0)
      .sort((a, b) => b.gap - a.gap)
    if (!ranked.length) return 'Stock comfortably covers open demand. Keep regular drives on schedule to maintain levels.'
    const lines = ranked.slice(0, 4).map((x, i) => {
      const donors = matchDonors(data.donors, x.g).filter((m) => m.donor.bloodGroup === x.g).length
      return `${i + 1}. **${x.g}** — ${x.units} in stock, ${x.demand} requested. Contact ${donors} eligible ${x.g} donor${donors === 1 ? '' : 's'}; target +${Math.ceil(x.gap)} units.`
    })
    const next = data.drives.filter((d) => d.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date))[0]
    return `Recommended restock priorities:\n\n${lines.join('\n')}${next ? `\n\nPromote the next drive, **${next.title}** on ${formatDate(next.date)} in ${next.city}, to these donor groups.` : '\n\nNo upcoming drives are scheduled — consider creating one.'}`
  }

  if (/(critical|urgent|emergency|request|pending)/.test(q)) {
    const list = (/(critical|urgent|emergency)/.test(q) ? open.filter((r) => r.urgency === 'critical') : open).slice(0, 6)
    if (!list.length) return 'There are no matching open requests right now.'
    const lines = list.map((r) => {
      const ok = data.inventory[r.bloodGroup].units >= r.units
      return `- **${r.id}** · ${r.units}u ${r.bloodGroup} for ${r.patientName} at ${r.hospital}, ${r.city} — ${r.status}, needed by ${formatDate(r.neededBy)}. ${ok ? 'Stock available.' : 'Insufficient stock — mobilize donors.'}`
    })
    return `There are ${open.length} open requests. ${list.length} shown:\n\n${lines.join('\n')}`
  }

  if (/(eligib|again|how often|wait)/.test(q)) {
    return `Whole-blood donors must wait **${DONATION_INTERVAL_DAYS} days** between donations. General eligibility: aged 18–65, weigh at least 110 lbs (50 kg), feel healthy, and have no fever or infection in the last two weeks. You can check each donor's status in the Donor Directory.`
  }

  if (/(drive|camp|event)/.test(q)) {
    const upcoming = data.drives.filter((d) => d.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date))
    if (!upcoming.length) return 'No upcoming drives are scheduled. You can create one from the Donation Drives page.'
    return `Upcoming and ongoing drives:\n\n${upcoming.map((d) => `- **${d.title}** — ${formatDate(d.date)}, ${d.location}, ${d.city} (${d.collectedUnits}/${d.targetUnits} units)`).join('\n')}`
  }

  if (/(how many|statistic|summary|overview|donor)/.test(q)) {
    const available = data.donors.filter((d) => d.available).length
    return `Network overview:\n\n- **${data.donors.length}** registered donors (${available} available)\n- **${open.length}** open blood requests\n- **${totalUnits(data.inventory)}** units in inventory\n- **${data.donations.length}** donations recorded\n- **${data.drives.length}** donation drives`
  }

  return 'I can help with inventory levels, donor matching (e.g. "find donors for B- in Chicago"), compatibility, open requests, eligibility and drives. Try one of the suggestions below.'
}
