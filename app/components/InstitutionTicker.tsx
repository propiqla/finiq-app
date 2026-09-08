'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'
import { colorForInstitution } from '../lib/institutionColor'

type Institution = { slug: string; name: string; website: string | null }

export default function InstitutionTicker() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabaseBanking
        .from('institutions')
        .select('slug, name, website')
        .eq('show_in_ticker', true)
        .eq('active', true)
        .order('ticker_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })

      if (cancelled) return
      if (error) {
        setLoadFailed(true)
        return
      }
      setInstitutions(data ?? [])
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loadFailed || institutions.length === 0) return null

  // Duplicate the list so the CSS animation can loop seamlessly at -50%.
  const looped = [...institutions, ...institutions]

  return (
    <div className="overflow-hidden border-b border-gray-200 bg-white py-2">
      <p className="mb-1.5 px-6 text-[10px] font-medium uppercase tracking-wide text-gray-400">
        Instituciones con productos activos
      </p>
      <div className="ticker-track flex w-max gap-2 px-6">
        {looped.map((inst, i) => {
          const color = colorForInstitution(inst.name)
          return (
            <Link
              key={`${inst.slug}-${i}`}
              href={`/finiq/bancos/${inst.slug}`}
              className={`flex h-12 w-28 shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-center text-xs font-medium leading-tight transition hover:opacity-80 ${color.bg} ${color.text}`}
            >
              <span className="line-clamp-2">{inst.name}</span>
            </Link>
          )
        })}
      </div>
      <style jsx>{`
        .ticker-track {
          animation: finiq-ticker-scroll 48s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes finiq-ticker-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}
