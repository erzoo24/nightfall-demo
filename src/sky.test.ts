import { describe, expect, it } from 'vitest'
import { computeNight, direction, moonPhaseName, nextDates, places, scoreNight, visiblePlanets } from './sky'

const place = (id: string) => places.find((p) => p.id === id)!

describe('computeNight', () => {
  it('finds a long astronomical night in Berlin at the winter solstice', () => {
    const night = computeNight(place('berlin'), '2026-12-21')
    expect(night.twilightOnly).toBe(false)
    expect(night.darkHours).toBeGreaterThan(10)
  })

  it('knows that Reykjavík has no astronomical night at midsummer', () => {
    const night = computeNight(place('reykjavik'), '2026-06-21')
    expect(night.twilightOnly).toBe(true)
  })

  it('keeps every score between 0 and 100 and the best window inside the night', () => {
    for (const p of places) {
      for (const date of nextDates('2026-11-02', 7)) {
        const night = computeNight(p, date)
        expect(night.score).toBeGreaterThanOrEqual(0)
        expect(night.score).toBeLessThanOrEqual(100)
        if (night.best && night.dusk && night.dawn) {
          expect(night.best.start.getTime()).toBeGreaterThanOrEqual(night.dusk.getTime())
          expect(night.best.end.getTime()).toBeLessThanOrEqual(night.dawn.getTime())
        }
      }
    }
  })

  it('lists only planets that rise at least 10° above the horizon', () => {
    const planets = visiblePlanets(computeNight(place('lapalma'), '2026-11-02'))
    for (const p of planets) expect(p.altitude).toBeGreaterThanOrEqual(10)
  })
})

describe('scoreNight', () => {
  const night = { clouds: 0.1, moonInterference: 0, darkHours: 8 }

  it('rates a dark site higher than a city under the same sky', () => {
    expect(scoreNight({ ...night, bortle: 2 })).toBeGreaterThan(scoreNight({ ...night, bortle: 8 }))
  })

  it('drops with clouds and a bright moon', () => {
    const clear = scoreNight({ ...night, bortle: 3 })
    expect(scoreNight({ ...night, bortle: 3, clouds: 0.8 })).toBeLessThan(clear)
    expect(scoreNight({ ...night, bortle: 3, moonInterference: 1 })).toBeLessThan(clear)
  })
})

describe('helpers', () => {
  it('names the moon phases', () => {
    expect(moonPhaseName(0)).toBe('New Moon')
    expect(moonPhaseName(90)).toBe('First Quarter')
    expect(moonPhaseName(180)).toBe('Full Moon')
    expect(moonPhaseName(300)).toBe('Waning Crescent')
  })

  it('turns azimuths into compass points', () => {
    expect(direction(0)).toBe('N')
    expect(direction(135)).toBe('SE')
    expect(direction(359)).toBe('N')
  })
})
