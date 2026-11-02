import { Cloud, CloudMoon, MoonStar } from 'lucide-react'
import type { Night } from '../sky'
import { Glass, LargeTitle, MoonIcon, scoreColor } from '../ui'

export default function Week({ nights, onPick }: { nights: Night[]; onPick: (date: string) => void }) {
  const day = (date: string, i: number) =>
    i === 0 ? 'Tonight' : new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))

  return (
    <div className="animate-rise pb-28">
      <LargeTitle kicker="Forecast" title="7 Nights" subtitle={nights[0]?.place.name} />
      <Glass className="mx-4 mt-3 overflow-hidden">
        {nights.map((n, i) => {
          const Icon = n.clouds > 0.55 ? Cloud : n.clouds > 0.25 ? CloudMoon : MoonStar
          return (
            <button key={n.date} onClick={() => onPick(n.date)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 ${i ? 'border-t-[0.5px] border-separator' : ''}`}>
              <span className="w-[68px] text-[17px] font-medium">{day(n.date, i)}</span>
              <Icon size={20} className="text-label-2" />
              <MoonIcon fraction={n.moonIllumination} waxing={n.moonWaxing} size={18} />
              <div className="relative mx-2 h-1.5 flex-1 rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(4, n.score)}%`, background: `linear-gradient(90deg, #5e5ce6, ${scoreColor(n.score)})` }} />
              </div>
              <span className="w-8 text-right text-[17px] font-semibold tabular-nums">{n.score}</span>
            </button>
          )
        })}
      </Glass>
      <p className="mx-6 mt-5 text-center text-[12px] leading-snug text-label-3">
        Score combines darkness, moonlight, light pollution and clouds. Tap a night for details.
      </p>
    </div>
  )
}
