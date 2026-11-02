import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BatteryFull, CalendarDays, MapPin, MoonStar, Signal, Wifi } from 'lucide-react'
import { computeNight, nextDates, places, todayIn, visiblePlanets } from './sky'
import { Stars } from './ui'
import Tonight from './screens/Tonight'
import Week from './screens/Week'
import Places from './screens/Places'

type Tab = 'tonight' | 'week' | 'places'

// URL parameters open a specific state, e.g. ?place=berlin&date=2026-11-03&tab=week (used for screenshots).
const params = new URLSearchParams(location.search)

function useWide() {
  const query = '(min-width: 760px)'
  const [wide, setWide] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

function NightfallApp({ framed }: { framed: boolean }) {
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'tonight')
  const [placeId, setPlaceId] = useState(params.get('place') ?? 'lapalma')
  const place = places.find((p) => p.id === placeId) ?? places[0]
  const today = params.get('date') ?? todayIn(place.timeZone)
  const [date, setDate] = useState(today)

  const night = useMemo(() => computeNight(place, date), [place, date])
  const planets = useMemo(() => visiblePlanets(night), [night])
  const week = useMemo(() => nextDates(today, 7).map((d) => computeNight(place, d)), [place, today])
  const tonightEverywhere = useMemo(() => places.map((p) => computeNight(p, today)), [today])
  // Sheets render here, above the scrolling page and the tab bar, like on iOS.
  const [sheetHost, setSheetHost] = useState<HTMLDivElement | null>(null)

  const tabs: { id: Tab; label: string; icon: typeof MoonStar }[] = [
    { id: 'tonight', label: 'Tonight', icon: MoonStar },
    { id: 'week', label: 'Week', icon: CalendarDays },
    { id: 'places', label: 'Places', icon: MapPin },
  ]

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(120%_70%_at_50%_0%,#26306b_0%,#0d1230_45%,#05070f_100%)]">
      <Stars />
      <div className="no-scrollbar absolute inset-0 overflow-y-auto" style={{ paddingTop: framed ? 54 : 'max(env(safe-area-inset-top), 12px)' }}>
        {tab === 'tonight' && <Tonight key={`${place.id}${date}`} night={night} planets={planets} isToday={date === today} initialPlanet={params.get('planet')} sheetHost={sheetHost} />}
        {tab === 'week' && <Week nights={week} onPick={(d) => { setDate(d); setTab('tonight') }} />}
        {tab === 'places' && <Places nights={tonightEverywhere} selected={place.id} onPick={(id) => { setPlaceId(id); setDate(today); setTab('tonight') }} />}
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-20 flex border-t-[0.5px] border-separator bg-[#0b0d1c]/70 backdrop-blur-2xl" style={{ paddingBottom: framed ? 26 : 'max(env(safe-area-inset-bottom), 8px)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); if (id === 'tonight') setDate(today) }} className={`flex flex-1 flex-col items-center gap-0.5 pt-2 text-[10px] font-medium ${tab === id ? 'text-sys-teal' : 'text-label-2'}`}>
            <Icon size={24} strokeWidth={tab === id ? 2.2 : 1.8} />
            {label}
          </button>
        ))}
      </nav>
      <div ref={setSheetHost} className="pointer-events-none absolute inset-0 z-30" />
      {framed && <div className="absolute bottom-2 left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/80" />}
    </div>
  )
}

function Phone({ children, fixed }: { children: ReactNode; fixed?: boolean }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    if (fixed) return
    const fit = () => setScale(Math.min(1, (innerHeight - 48) / 868))
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [fixed])
  return (
    <div style={{ width: 414 * scale, height: 868 * scale }}>
      <div
        className={`origin-top-left rounded-[58px] bg-[#111] p-3 ${fixed ? 'shadow-[inset_0_0_0_2px_#2a2a2e]' : 'shadow-[0_40px_120px_rgba(40,60,160,0.35),inset_0_0_0_2px_#2a2a2e]'}`}
        style={{ width: 414, height: 868, transform: `scale(${scale})` }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[46px]">
          <div className="absolute left-1/2 top-[11px] z-40 h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute inset-x-0 top-0 z-30 flex h-[54px] items-center justify-between px-8 pt-1 text-[16px] font-semibold">
            <span>9:41</span>
            <span className="flex items-center gap-1.5"><Signal size={16} /><Wifi size={16} /><BatteryFull size={22} /></span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const wide = useWide()
  // ?shot=phone renders only the phone on a transparent page, for marketing images.
  if (params.get('shot') === 'phone') {
    document.body.style.background = 'transparent'
    return <Phone fixed><NightfallApp framed /></Phone>
  }
  if (!wide) return <div className="h-dvh"><NightfallApp framed={false} /></div>

  return (
    <div className="relative flex min-h-screen items-center justify-center gap-20 overflow-hidden bg-[radial-gradient(80%_60%_at_70%_40%,#1b2350_0%,#070a18_60%,#04050c_100%)] px-10 py-6">
      <Stars count={160} />
      <div className="relative max-w-[380px]">
        <div className="mb-6 grid h-[72px] w-[72px] place-items-center rounded-[18px] bg-[linear-gradient(145deg,#5e5ce6,#1b1f4a)] shadow-lg">
          <MoonStar size={38} />
        </div>
        <h1 className="text-[52px] font-bold leading-none tracking-tight">Nightfall</h1>
        <p className="mt-3 text-[22px] leading-snug text-label-2">Find tonight's best moment to see the stars.</p>
        <ul className="mt-8 flex flex-col gap-3 text-[16px] text-label-2">
          <li>✦ Real positions of Sun, Moon and planets</li>
          <li>✦ A sky score for every night and place</li>
          <li>✦ Installs on the iPhone home screen</li>
        </ul>
        <p className="mt-10 text-[13px] text-label-3">Demo app · the cloud forecast is simulated</p>
      </div>
      <div className="relative"><Phone><NightfallApp framed /></Phone></div>
    </div>
  )
}
