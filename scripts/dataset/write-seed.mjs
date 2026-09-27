// Write data/seed/expeditions.json and data/seed/stations.json from public sources
// (Wikipedia CC BY-SA, NCPOR). No invented values: a field is left null/empty when
// the source doesn't give it (e.g. Himansh's exact coordinates, or the 26th/27th
// expedition's season dates, or per-expedition station assignments before Bharati
// existed in 2012 — the source table doesn't break that down).
//
// Sources checked 2026-09-27:
//   https://en.wikipedia.org/wiki/Indian_Antarctic_Program
//   https://en.wikipedia.org/wiki/Maitri_(research_station)
//   https://en.wikipedia.org/wiki/Bharati_(research_station)
//   https://en.wikipedia.org/wiki/Himadri_(research_station)
//   https://en.wikipedia.org/wiki/Dakshin_Gangotri
//   https://en.wikipedia.org/wiki/National_Centre_for_Polar_and_Ocean_Research (Himansh section)
//   https://ncpor.res.in/pages/display/268-himalaya (Himansh, confirms no public lat/lng)
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const WIKI_EXPEDITIONS = 'https://en.wikipedia.org/wiki/Indian_Antarctic_Program'
const WIKI_LICENSE = 'CC BY-SA 4.0'
const WIKI_ATTRIBUTION = 'Wikipedia contributors, "Indian Antarctic Program", CC BY-SA 4.0'

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

// [number, seasonStart, seasonEnd, leader] — seasonStart/End null where the source
// gives no dates. Numbers 32, 35 and 36 are absent from the Wikipedia table.
const EXPEDITION_ROWS = [
  [1, 1981, 1982, 'Dr. Sayed Zahoor Qasim'],
  [2, 1982, 1983, 'V. K. Raina'],
  [3, 1983, 1985, 'Dr. Harsh K. Gupta'],
  [4, 1984, 1984, 'Dr B.B. Bhattacharya'],
  [5, 1985, 1986, 'M.K. Kaul'],
  [6, 1986, 1987, 'Dr A M Parulekar'],
  [7, 1987, 1989, 'Dr R. Sen Gupta'],
  [8, 1988, 1990, 'Dr Amitava Sen Gupta'],
  [9, 1989, 1991, 'Rasik Ravindra'],
  [10, 1990, 1992, 'Dr A. K. Hanjura'],
  [11, 1991, 1993, 'Dr Shardendu Mukherjee'],
  [12, 1992, 1994, 'Dr Vinod K Dhargalkar'],
  [13, 1993, 1995, 'G Sudhakar Rao'],
  [14, 1994, 1996, 'Dr S D Sharma'],
  [15, 1995, 1996, 'Arun Chaturvedi'],
  [16, 1996, 1998, 'Dr Anand L. Koppar'],
  [17, 1997, 1999, 'K. R. Shivan'],
  [18, 1998, 2000, 'Ajay Dhar'],
  [19, 1999, 2001, 'Arun Chaturvedi'],
  [20, 2000, 2003, "Marvin D'Souza"],
  [21, 2001, 2003, 'Ram Prasad Lal'],
  [22, 2002, 2004, 'Dr Arun Hanchinal'],
  [23, 2003, 2005, 'S. Jayaram'],
  [24, 2004, 2006, 'Rajesh Asthana'],
  [25, 2005, 2007, 'L. Prem Kishore'],
  [26, null, null, 'Mr Jayapaul D'],
  [27, null, null, 'Mr Arun Chaturvedi'],
  [28, 2008, 2009, 'Dr. P. Malhotra'],
  [29, 2009, 2010, 'P. Elango'],
  [30, 2010, 2011, 'K. Jeeva'],
  [31, 2011, 2012, 'Dr. Rupesh M. Das & Shree Uttam Chand'],
  [33, 2013, 2014, 'Mohd. Yunus Shah & Abhijit Patil'],
  [34, 2014, 2015, 'Kailash Bhindwar & Syed Shadab'],
  [37, 2017, 2018, 'Dr. Shailesh Pednekar'],
  [38, 2018, 2020, 'K. Jeeva & P. Elengo'],
  [39, 2019, 2020, 'Deepak Gajbhiye & Debdip Chakraborty'],
  [40, 2020, 2021, 'Ravindra S. More & Atul Kulkarni'],
  [41, 2021, 2022, 'Huidram Singh & Anoop K Soman'],
  [42, 2022, 2023, 'Arun Sable & Pranjal Saikia'],
]

function buildExpeditions() {
  return EXPEDITION_ROWS.map(([number, seasonStart, seasonEnd, leader]) => {
    const ord = ordinal(number)
    const season = seasonStart ? ` (season ${seasonStart}–${seasonEnd})` : ''
    return {
      title: `${ord} Indian Antarctic Expedition`,
      number: String(number),
      region: 'antarctic',
      season_start: seasonStart,
      season_end: seasonEnd,
      leader,
      stations: [], // not broken down per-expedition in the source table
      summary: `The ${ord} Indian Antarctic Expedition${season} was led by ${leader}.`,
      highlights: [],
      cover: null,
      source_url: WIKI_EXPEDITIONS,
      license: WIKI_LICENSE,
      attribution: WIKI_ATTRIBUTION,
    }
  })
}

function buildStations() {
  return [
    {
      name: 'Dakshin Gangotri',
      region: 'antarctic',
      lat: -70.0742,
      lng: 12.0034,
      established: 1984,
      decommissioned: 1990,
      status: 'historical',
      description:
        "India's first Antarctic research facility, built in eight weeks by an 81-member team and commissioned 26 January 1984. Solar-powered with computerised data recording; ran unmanned oceanography, geology, glaciology and geomagnetism research. Abandoned in 1990 after becoming submerged in ice; succeeded by Maitri.",
      cover: null,
      source_url: 'https://en.wikipedia.org/wiki/Dakshin_Gangotri',
      license: WIKI_LICENSE,
      attribution: 'Wikipedia contributors, "Dakshin Gangotri", CC BY-SA 4.0',
    },
    {
      name: 'Maitri',
      region: 'antarctic',
      lat: -70.766667,
      lng: 11.731944,
      established: 1989,
      decommissioned: null,
      status: 'active',
      description:
        "India's second permanent Antarctic station, in the Schirmacher Oasis about 5 km from Russia's Novolazarevskaya Station. Operational year-round; hosts 25 people in winter and 45 in summer, across biology, earth sciences, glaciology, atmospheric sciences, meteorology and medicine research. Freshwater comes from Lake Priyadarshini.",
      cover: null,
      source_url: 'https://en.wikipedia.org/wiki/Maitri_(research_station)',
      license: WIKI_LICENSE,
      attribution: 'Wikipedia contributors, "Maitri (research station)", CC BY-SA 4.0',
    },
    {
      name: 'Bharati',
      region: 'antarctic',
      lat: -69.40803,
      lng: 76.187361,
      established: 2012,
      decommissioned: null,
      status: 'active',
      description:
        "India's third Antarctic station, in the Larsemann Hills on Prydz Bay, commissioned 18 March 2012. A 2,162 sq m building housing up to 72 personnel; supports oceanographic and geological research and hosts ISRO's Antarctica Ground Station for Earth observation satellite data.",
      cover: null,
      source_url: 'https://en.wikipedia.org/wiki/Bharati_(research_station)',
      license: WIKI_LICENSE,
      attribution: 'Wikipedia contributors, "Bharati (research station)", CC BY-SA 4.0',
    },
    {
      name: 'Himadri',
      region: 'arctic',
      lat: 78.917,
      lng: 11.933,
      established: 2008,
      decommissioned: null,
      status: 'active',
      description:
        "India's first permanent Arctic research station, at the International Arctic Research base in Ny-Ålesund, Svalbard, inaugurated 1 July 2008. A refurbished two-floor building (220 m², four bedrooms) hosting eight scientists at a time, roughly 1,200 km from the North Pole. Research covers fjord dynamics, atmospheric studies, aerosols, glaciers and microbial communities.",
      cover: null,
      source_url: 'https://en.wikipedia.org/wiki/Himadri_(research_station)',
      license: WIKI_LICENSE,
      attribution: 'Wikipedia contributors, "Himadri (research station)", CC BY-SA 4.0',
    },
    {
      name: 'Himansh',
      region: 'himalaya',
      lat: null, // no public lat/lng on NCPOR's own page — left empty, not invented
      lng: null,
      established: 2016,
      decommissioned: null,
      status: 'active',
      description:
        'A Himalayan glaciology station at Sutri Dhaka, Chandra Basin, Lahaul-Spiti valley, Himachal Pradesh, at 4,080 m amsl, unveiled 9 October 2016 by NCPOR to study glacier-climate relationships and Himalayan glacier response to climate change. Studies nearby glaciers including Chhota Shigri, Hamtah, Patsio, Mamtusa and Miyad.',
      cover: null,
      source_url: 'https://ncpor.res.in/pages/display/268-himalaya',
      license: null, // official NCPOR page, not Wikipedia — no reuse license stated
      attribution: 'National Centre for Polar and Ocean Research (NCPOR)',
    },
  ]
}

async function main() {
  const outDir = path.resolve('data/seed')
  await mkdir(outDir, { recursive: true })

  const expeditions = buildExpeditions()
  const stations = buildStations()

  await writeFile(path.join(outDir, 'expeditions.json'), JSON.stringify(expeditions, null, 2) + '\n', 'utf8')
  await writeFile(path.join(outDir, 'stations.json'), JSON.stringify(stations, null, 2) + '\n', 'utf8')

  console.log(`Wrote ${expeditions.length} expeditions and ${stations.length} stations to ${outDir}`)
  console.log('Expedition numbers missing from the source table (not invented): 32, 35, 36')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
