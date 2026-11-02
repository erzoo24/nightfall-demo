import { Body, Equator, Horizon, Illumination, MoonPhase, Observer } from 'astronomy-engine'

// Sun, moon and planet positions are real (astronomy-engine). The cloud forecast is
// simulated for the demo; a real app would call a weather API at the same seam.

export interface Place {
  id: string
  name: string
  region: string
  lat: number
  lon: number
  timeZone: string
  bortle: number // 1 = pristine dark sky, 9 = inner city
}

export const places: Place[] = [
  { id: 'berlin', name: 'Berlin', region: 'Germany', lat: 52.52, lon: 13.405, timeZone: 'Europe/Berlin', bortle: 8 },
  { id: 'havelland', name: 'Westhavelland', region: 'Dark Sky Reserve, Germany', lat: 52.7, lon: 12.33, timeZone: 'Europe/Berlin', bortle: 3 },
  { id: 'lapalma', name: 'La Palma', region: 'Canary Islands, Spain', lat: 28.76, lon: -17.88, timeZone: 'Atlantic/Canary', bortle: 2 },
  { id: 'reykjavik', name: 'Reykjavík', region: 'Iceland', lat: 64.15, lon: -21.94, timeZone: 'Atlantic/Reykjavik', bortle: 6 },
  { id: 'namibrand', name: 'NamibRand', region: 'Namibia', lat: -25.0, lon: 16.0, timeZone: 'Africa/Windhoek', bortle: 1 },
]

const STEP_MIN = 10
const PLANETS = [Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn]

export interface Sample {
  time: Date
  sunAlt: number
  moonAlt: number
  clouds: number
}

export interface PlanetView {
  name: string
  bestTime: Date
  altitude: number
  direction: string
  magnitude: number
}

export interface Night {
  place: Place
  date: string // local calendar date of the evening, YYYY-MM-DD
  samples: Sample[]
  dusk: Date | null // start of astronomical night
  dawn: Date | null
  twilightOnly: boolean // sun never gets 18° below the horizon
  darkHours: number
  moonIllumination: number
  moonPhase: string
  moonWaxing: boolean
  moonUpInDark: number // share of the dark hours with the moon above the horizon
  clouds: number // average over the dark hours
  best: { start: Date; end: Date } | null
  score: number
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor'
}

// Deterministic pseudo-random numbers so the simulated forecast is stable per place and night.
function hash(text: string) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

export function simulatedClouds(placeId: string, date: string, hourOfNight: number) {
  const base = Math.pow(hash(`${placeId}|${date}`), 2) * 0.85
  const wave = 0.18 * Math.sin(hourOfNight / 2.2 + hash(`${date}|${placeId}`) * 6)
  return Math.min(1, Math.max(0, base + wave))
}

export function moonPhaseName(angle: number) {
  const a = ((angle % 360) + 360) % 360
  if (a < 7 || a >= 353) return 'New Moon'
  if (a < 83) return 'Waxing Crescent'
  if (a < 97) return 'First Quarter'
  if (a < 173) return 'Waxing Gibbous'
  if (a < 187) return 'Full Moon'
  if (a < 263) return 'Waning Gibbous'
  if (a < 277) return 'Last Quarter'
  return 'Waning Crescent'
}

const LIGHT_POLLUTION = [1, 1, 0.97, 0.92, 0.85, 0.77, 0.7, 0.62, 0.55, 0.45]

export function scoreNight(input: { clouds: number; moonInterference: number; darkHours: number; bortle: number }) {
  const darkness = Math.min(1, input.darkHours / 5)
  const raw =
    Math.pow(1 - input.clouds, 1.2) * (1 - 0.65 * input.moonInterference) * (0.55 + 0.45 * darkness) * LIGHT_POLLUTION[input.bortle]
  return Math.round(Math.min(100, Math.max(0, raw * 100)))
}

export const labelFor = (score: number): Night['label'] => (score >= 75 ? 'Excellent' : score >= 55 ? 'Good' : score >= 35 ? 'Fair' : 'Poor')

const altitude = (body: Body, time: Date, observer: Observer) => {
  const eq = Equator(body, time, observer, true, true)
  return Horizon(time, observer, eq.ra, eq.dec, 'normal')
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export const direction = (azimuth: number) => COMPASS[Math.round(azimuth / 22.5) % 16]

export function computeNight(place: Place, date: string): Night {
  const observer = new Observer(place.lat, place.lon, 0)
  const [y, m, d] = date.split('-').map(Number)
  // Approximate local solar noon; the night runs until solar noon of the next day.
  const start = Date.UTC(y, m - 1, d, 12) - (place.lon / 15) * 3600_000

  const samples: Sample[] = []
  for (let min = 0; min < 24 * 60; min += STEP_MIN) {
    const time = new Date(start + min * 60_000)
    samples.push({
      time,
      sunAlt: altitude(Body.Sun, time, observer).altitude,
      moonAlt: altitude(Body.Moon, time, observer).altitude,
      clouds: simulatedClouds(place.id, date, min / 60),
    })
  }

  let dark = samples.filter((s) => s.sunAlt < -18)
  const twilightOnly = dark.length === 0
  if (twilightOnly) dark = samples.filter((s) => s.sunAlt < -12)

  const mid = dark[Math.floor(dark.length / 2)]?.time ?? new Date(start + 12 * 3600_000)
  const moonIllumination = Illumination(Body.Moon, mid).phase_fraction
  const phaseAngle = MoonPhase(mid)
  const darkHours = (dark.length * STEP_MIN) / 60
  const moonUpInDark = dark.length ? dark.filter((s) => s.moonAlt > 0).length / dark.length : 0
  const clouds = dark.length ? dark.reduce((sum, s) => sum + s.clouds, 0) / dark.length : 1

  // Longest stretch of dark sky with few clouds and no bright moon.
  let best: Night['best'] = null
  let run: Sample[] = []
  const flush = () => {
    if (run.length * STEP_MIN >= 30 && (!best || run.length > (best.end.getTime() - best.start.getTime()) / 60_000 / STEP_MIN)) {
      best = { start: run[0].time, end: new Date(run[run.length - 1].time.getTime() + STEP_MIN * 60_000) }
    }
    run = []
  }
  for (const s of samples) {
    const good = dark.includes(s) && s.clouds < 0.45 && (s.moonAlt < 0 || moonIllumination < 0.3)
    if (good) run.push(s)
    else flush()
  }
  flush()

  const score = dark.length ? scoreNight({ clouds, moonInterference: moonIllumination * moonUpInDark, darkHours, bortle: place.bortle }) : 0
  return {
    place,
    date,
    samples,
    dusk: dark[0]?.time ?? null,
    dawn: dark.length ? new Date(dark[dark.length - 1].time.getTime() + STEP_MIN * 60_000) : null,
    twilightOnly,
    darkHours,
    moonIllumination,
    moonPhase: moonPhaseName(phaseAngle),
    moonWaxing: phaseAngle < 180,
    moonUpInDark,
    clouds,
    best,
    score,
    label: labelFor(score),
  }
}

export function visiblePlanets(night: Night): PlanetView[] {
  const observer = new Observer(night.place.lat, night.place.lon, 0)
  // Bright planets are easy to see from nautical dusk on, so twilight counts too.
  const window = night.samples.filter((s) => s.sunAlt < -9)
  return PLANETS.map((body) => {
    let top = { time: window[0]?.time ?? new Date(), alt: -90, az: 0 }
    for (const s of window) {
      const h = altitude(body, s.time, observer)
      if (h.altitude > top.alt) top = { time: s.time, alt: h.altitude, az: h.azimuth }
    }
    return { name: body, bestTime: top.time, altitude: Math.round(top.alt), direction: direction(top.az), magnitude: Illumination(body, top.time).mag }
  })
    .filter((p) => p.altitude >= 10)
    .sort((a, b) => a.magnitude - b.magnitude)
}

export function nextDates(from: string, count: number) {
  const [y, m, d] = from.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10))
}

export function todayIn(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export const clock = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(date)
