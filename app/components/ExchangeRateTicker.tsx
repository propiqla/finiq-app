'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBanking } from '../lib/supabase-banking'

type RateRow = {
  rate_type: string
  base_currency: string
  rate: number
  effective_date: string
}

const formatBs = (n: number) =>
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ExchangeRateTicker() {
  const [rates, setRates] = useState<RateRow[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data } = await supabaseBanking
        .from('exchange_rates')
        .select('rate_type, base_currency, rate, effective_date')
        .order('effective_date', { ascending: false })
        .order('scraped_at', { ascending: false })
      if (!cancelled) setRates((data as RateRow[]) ?? [])
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (rates.length === 0) return null

  const latestFor = (rateType: string, currency: string) =>
    rates.find((r) => r.rate_type === rateType && r.base_currency === currency)

  const usdBcv = latestFor('bcv_oficial', 'USD')
  const usdParalelo = latestFor('paralelo_referencial', 'USD')
  const eurBcv = latestFor('bcv_oficial', 'EUR')

  const items = [
    usdBcv ? { label: 'USD · BCV oficial', value: `Bs ${formatBs(usdBcv.rate)}` } : null,
    usdParalelo ? { label: 'USD · Paralelo', value: `Bs ${formatBs(usdParalelo.rate)}` } : null,
    eurBcv ? { label: 'EUR · BCV oficial', value: `Bs ${formatBs(eurBcv.rate)}` } : null,
  ].filter((x): x is { label: string; value: string } => x !== null)

  if (items.length === 0) return null

  const looped = [...items, ...items, ...items]

  return (
    <div className="overflow-hidden border-b border-teal-800 bg-[#0D3B36] py-2">
      <style jsx>{`
        @keyframes finiq-rate-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-33.333%);
          }
        }
        .rate-track {
          animation: finiq-rate-scroll 22s linear infinite;
        }
        .rate-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <Link href="/finiq/indicadores" className="block">
        <div className="rate-track flex w-max items-center gap-8 px-6">
          {looped.map((item, i) => (
            <span key={i} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs">
              <span className="font-medium text-teal-200">{item.label}</span>
              <span className="font-semibold text-white">{item.value}</span>
            </span>
          ))}
        </div>
      </Link>
    </div>
  )
}
