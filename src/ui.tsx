import { useMemo } from 'react'
import type { ReactNode } from 'react'

export const scoreColor = (score: number) => (score >= 75 ? '#30d158' : score >= 55 ? '#64d2ff' : score >= 35 ? '#ffd60a' : '#ff9f0a')

export function Glass({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`glass rounded-[22px] ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="mb-2 mt-6 px-4 text-[13px] font-medium uppercase tracking-wide text-label-2">{children}</div>
}

export function LargeTitle({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <header className="px-4 pb-2 pt-3">
      {kicker && <div className="text-[13px] font-semibold uppercase tracking-wider text-sys-teal">{kicker}</div>}
      <h1 className="text-[34px] font-bold leading-[41px] tracking-[-0.4px]">{title}</h1>
      {subtitle && <div className="text-[15px] text-label-2">{subtitle}</div>}
    </header>
  )
}

export function ScoreRing({ score, size = 168 }: { score: number; size?: number }) {
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={12} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s' }}
      />
    </svg>
  )
}

// Moon drawn from the illuminated fraction; waxing moons are lit on the right.
export function MoonIcon({ fraction, waxing, size = 56 }: { fraction: number; waxing: boolean; size?: number }) {
  const r = size / 2 - 1
  const cx = size / 2
  const top = `${cx} ${cx - r}`
  const bottom = `${cx} ${cx + r}`
  const rx = Math.abs(1 - 2 * fraction) * r
  const gibbous = fraction > 0.5
  const outer = waxing ? 1 : 0
  const inner = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cx} r={r} fill="#1c2033" />
      <path d={`M ${top} A ${r} ${r} 0 0 ${outer} ${bottom} A ${rx} ${r} 0 0 ${inner} ${top} Z`} fill="#f4f1e6" />
    </svg>
  )
}

export function Stars({ count = 90 }: { count?: number }) {
  const stars = useMemo(() => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: count }, () => ({ x: rnd() * 100, y: rnd() * 100, s: rnd() < 0.15 ? 2 : 1, d: rnd() * 5 }))
  }, [count])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animation: `twinkle 4s ${st.d}s infinite` }}
        />
      ))}
    </div>
  )
}
