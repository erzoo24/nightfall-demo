import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import type { Night } from '../sky'
import { Glass, LargeTitle, scoreColor } from '../ui'

const darkness = (bortle: number) => (bortle <= 2 ? 'Pristine dark sky' : bortle <= 4 ? 'Rural sky' : bortle <= 6 ? 'Suburban sky' : 'City sky')

export default function Places({ nights, selected, onPick }: { nights: Night[]; selected: string; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const visible = nights.filter((n) => `${n.place.name} ${n.place.region}`.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="animate-rise pb-28">
      <LargeTitle title="Places" subtitle="Tonight's score at each spot" />
      <label className="mx-4 mt-2 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
        <Search size={17} className="text-label-2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="flex-1 bg-transparent text-[17px] outline-none placeholder:text-label-2" />
      </label>
      <Glass className="mx-4 mt-4 overflow-hidden">
        {visible.map((n, i) => (
          <button key={n.place.id} onClick={() => onPick(n.place.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5 ${i ? 'border-t-[0.5px] border-separator' : ''}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[17px]">
                {n.place.name}
                {n.place.id === selected && <Check size={16} className="text-sys-teal" />}
              </div>
              <div className="text-[13px] text-label-2">{n.place.region} · {darkness(n.place.bortle)}</div>
            </div>
            <span className="min-w-[46px] rounded-full px-2.5 py-1 text-center text-[15px] font-semibold text-black" style={{ background: scoreColor(n.score) }}>{n.score}</span>
          </button>
        ))}
        {visible.length === 0 && <div className="p-4 text-[15px] text-label-2">No places found.</div>}
      </Glass>
    </div>
  )
}
