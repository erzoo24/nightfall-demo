import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Compass, X } from 'lucide-react'
import { clock } from '../sky'
import type { Night, PlanetView } from '../sky'
import { Glass, LargeTitle, MoonIcon, ScoreRing, SectionTitle, scoreColor } from '../ui'

const PLANET_TIPS: Record<string, string> = {
  Mercury: 'Low and quick — look just after dusk or before dawn, close to the horizon.',
  Venus: 'The brightest point in the sky after the Moon. Impossible to miss.',
  Mars: 'Look for its orange-red colour. It does not twinkle like a star.',
  Jupiter: 'Even small binoculars show its four largest moons as tiny dots in a line.',
  Saturn: 'A small telescope at 30× magnification already shows the rings.',
}

const PLANET_COLOR: Record<string, string> = { Mercury: '#b9b4a8', Venus: '#f3e3b5', Mars: '#e2734a', Jupiter: '#e7c9a0', Saturn: '#e6d39a' }

function DarknessBar({ night }: { night: Night }) {
  const tz = night.place.timeZone
  const span = night.samples.filter((s) => s.sunAlt < 0)
  if (span.length === 0) return null
  const shade = (alt: number) => (alt > -6 ? '#3b4a7e' : alt > -12 ? '#28345f' : alt > -18 ? '#192142' : '#090d20')
  const best = night.best
  const inBest = (t: Date) => !!best && t >= best.start && t < best.end
  const sunset = span[0].time
  const sunrise = span[span.length - 1].time
  return (
    <div>
      <div className="mb-1 flex h-1.5 overflow-hidden rounded-full">
        {span.map((s) => (
          <div key={s.time.getTime()} className="flex-1" style={{ background: s.moonAlt > 0 ? 'rgba(244,241,230,0.75)' : 'transparent' }} />
        ))}
      </div>
      <div className="flex h-9 overflow-hidden rounded-xl">
        {span.map((s) => (
          <div key={s.time.getTime()} className="relative flex-1" style={{ background: shade(s.sunAlt) }}>
            {inBest(s.time) && <div className="absolute inset-x-0 bottom-0 h-1.5 bg-sys-green" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-label-2">
        <span>Sunset {clock(sunset, tz)}</span>
        {night.dusk && night.dawn && <span>Dark {clock(night.dusk, tz)}–{clock(night.dawn, tz)}</span>}
        <span>Sunrise {clock(sunrise, tz)}</span>
      </div>
      <div className="mt-3 flex gap-4 text-[12px] text-label-2">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-[#f4f1e6]/75" />Moon up</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-sys-green" />Best window</span>
      </div>
    </div>
  )
}

function PlanetSheet({ planet, timeZone, onClose }: { planet: PlanetView; timeZone: string; onClose: () => void }) {
  const azimuthDeg = { N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5 }[planet.direction] ?? 0
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-end bg-black/40" onClick={onClose}>
      <div className="animate-sheet w-full rounded-t-[28px] bg-[#1c1c27]/95 px-5 pb-10 pt-3 backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/25" />
        <div className="mb-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)]" style={{ background: `radial-gradient(circle at 35% 35%, #fff8, ${PLANET_COLOR[planet.name]} 45%, #0006)` }} />
          <div className="flex-1">
            <div className="text-[22px] font-bold">{planet.name}</div>
            <div className="text-[15px] text-label-2">Best at {clock(planet.bestTime, timeZone)}</div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-label-2" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Altitude', `${planet.altitude}°`],
            ['Direction', planet.direction],
            ['Brightness', `${planet.magnitude.toFixed(1)} mag`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/[0.06] py-3">
              <div className="text-[12px] text-label-2">{k}</div>
              <div className="text-[19px] font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4">
          <Compass size={36} className="shrink-0 text-sys-teal" style={{ transform: `rotate(${azimuthDeg - 45}deg)` }} />
          <p className="text-[15px] leading-snug text-label-2">{PLANET_TIPS[planet.name]}</p>
        </div>
      </div>
    </div>
  )
}

export default function Tonight({ night, planets, isToday, initialPlanet, sheetHost }: { night: Night; planets: PlanetView[]; isToday: boolean; initialPlanet?: string | null; sheetHost: HTMLElement | null }) {
  const [open, setOpen] = useState<PlanetView | null>(() => planets.find((p) => p.name === initialPlanet) ?? null)
  const tz = night.place.timeZone
  const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${night.date}T12:00:00Z`))

  return (
    <div className="animate-rise pb-28">
      <LargeTitle kicker={isToday ? 'Tonight' : dateLabel.split(' ')[0]} title={night.place.name} subtitle={`${night.place.region} · ${dateLabel}`} />

      <div className="relative mx-auto mt-2 grid h-[168px] w-[168px] place-items-center">
        <div className="absolute inset-0"><ScoreRing score={night.score} /></div>
        <div className="text-center">
          <div className="text-[56px] font-bold leading-none tracking-tight">{night.score}</div>
          <div className="text-[15px] font-semibold" style={{ color: scoreColor(night.score) }}>{night.label}</div>
        </div>
      </div>
      <p className="mt-3 text-center text-[15px] text-label-2">
        {night.best ? (
          <>Best window <span className="font-semibold text-white">{clock(night.best.start, tz)} – {clock(night.best.end, tz)}</span></>
        ) : night.twilightOnly ? 'Too bright tonight: the sun stays close below the horizon.' : 'No clear window tonight.'}
      </p>

      <SectionTitle>Darkness</SectionTitle>
      <Glass className="mx-4 p-4"><DarknessBar night={night} /></Glass>

      <SectionTitle>Moon</SectionTitle>
      <Glass className="mx-4 flex items-center gap-4 p-4">
        <MoonIcon fraction={night.moonIllumination} waxing={night.moonWaxing} />
        <div className="flex-1">
          <div className="text-[17px] font-semibold">{night.moonPhase}</div>
          <div className="text-[15px] text-label-2">{Math.round(night.moonIllumination * 100)}% lit · up {Math.round(night.moonUpInDark * 100)}% of the dark hours</div>
        </div>
      </Glass>

      <SectionTitle>Visible planets</SectionTitle>
      <Glass className="mx-4 overflow-hidden">
        {planets.length === 0 && <div className="p-4 text-[15px] text-label-2">No bright planets high enough tonight.</div>}
        {planets.map((p, i) => (
          <button key={p.name} onClick={() => setOpen(p)} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5 ${i ? 'border-t-[0.5px] border-separator' : ''}`}>
            <span className="h-7 w-7 rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, #fff8, ${PLANET_COLOR[p.name]} 45%, #0006)` }} />
            <div className="flex-1">
              <div className="text-[17px]">{p.name}</div>
              <div className="text-[13px] text-label-2">Best {clock(p.bestTime, tz)} · {p.altitude}° {p.direction}</div>
            </div>
            <ChevronRight size={18} className="text-label-3" />
          </button>
        ))}
      </Glass>

      <p className="mx-6 mt-6 text-center text-[12px] leading-snug text-label-3">
        Sun, Moon and planets are calculated for this location. The cloud forecast is simulated in this demo.
      </p>

      {open && sheetHost && createPortal(<PlanetSheet planet={open} timeZone={tz} onClose={() => setOpen(null)} />, sheetHost)}
    </div>
  )
}
