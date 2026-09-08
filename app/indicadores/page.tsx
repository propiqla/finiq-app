'use client'

import { useEffect, useState } from 'react'
import { supabaseBanking } from '../lib/supabase-banking'
import ExchangeRateTrendChart from '../components/ExchangeRateTrendChart'
import ExchangeRateGapChart from '../components/ExchangeRateGapChart'
import AdSlot from '../components/AdSlot'
import AlertSubscribeForm from '../components/AlertSubscribeForm'

type RateRow = {
  id: string
  rate_type: string
  base_currency: string
  rate: number
  effective_date: string
  source_name: string
  source_url: string
  notes: string | null
  range_30d_min: number | null
  range_30d_max: number | null
  change_30d_pct: number | null
}

const formatBs = (n: number) =>
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

type RangeKey = '7d' | '1m' | '3m' | '6m' | 'all'

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: '7d', label: '7D', days: 7 },
  { key: '1m', label: '1M', days: 30 },
  { key: '3m', label: '3M', days: 90 },
  { key: '6m', label: '6M', days: 180 },
  { key: 'all', label: 'Todo', days: null },
]

function filterByRange<T extends { effective_date: string }>(rows: T[], range: RangeKey): T[] {
  if (range === 'all' || rows.length === 0) return rows
  const days = RANGE_OPTIONS.find((o) => o.key === range)?.days
  if (!days) return rows
  const maxDate = rows[rows.length - 1].effective_date
  const cutoff = new Date(maxDate + 'T00:00:00')
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return rows.filter((r) => r.effective_date >= cutoffStr)
}

function RangeSelector({ value, onChange }: { value: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1 text-xs">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-full px-3 py-1 font-medium transition ${
            value === opt.key
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function RateCard({
  title,
  bg,
  currencyLabel,
  row,
  history,
}: {
  title: string
  bg: string
  currencyLabel: string
  row: RateRow | null
  history: RateRow[]
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 p-6 ${bg}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      {row ? (
        <>
          <p className="text-3xl font-semibold text-gray-900">
            Bs {formatBs(row.rate)}
            <span className="ml-1 text-base font-normal text-gray-500">/ {currencyLabel}</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Vigente {formatDate(row.effective_date)} ·{' '}
            <a
              href={row.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:underline"
            >
              {row.source_name}
            </a>
          </p>
          {row.range_30d_min != null && row.range_30d_max != null ? (
            <p className="mt-2 text-xs text-gray-600">
              Últimos 30 días: Bs {formatBs(row.range_30d_min)} – Bs {formatBs(row.range_30d_max)}
              {row.change_30d_pct != null ? ` (${row.change_30d_pct > 0 ? '+' : ''}${row.change_30d_pct}%)` : ''}
            </p>
          ) : null}
          {row.notes ? <p className="mt-3 text-sm text-gray-600">{row.notes}</p> : null}
          <div className="mt-4">
            <ExchangeRateTrendChart
              points={history.map((h) => ({ effective_date: h.effective_date, rate: h.rate }))}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">Sin dato disponible.</p>
      )}
    </div>
  )
}

export default function Indicadores() {
  const [rates, setRates] = useState<RateRow[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [range, setRange] = useState<RangeKey>('3m')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabaseBanking
        .from('exchange_rates')
        .select(
          'id, rate_type, base_currency, rate, effective_date, source_name, source_url, notes, range_30d_min, range_30d_max, change_30d_pct'
        )
        .order('effective_date', { ascending: true })
        .order('scraped_at', { ascending: true })

      if (cancelled) return
      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
        return
      }
      setRates((data as RateRow[]) ?? [])
      setStatus('ready')
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const historyFor = (rateType: string, currency: string) =>
    rates.filter((r) => r.rate_type === rateType && r.base_currency === currency)

  const latestOf = (rows: RateRow[]) => (rows.length ? rows[rows.length - 1] : null)

  const usdBcvHistory = historyFor('bcv_oficial', 'USD')
  const usdParaleloHistory = historyFor('paralelo_referencial', 'USD')
  const eurBcvHistory = historyFor('bcv_oficial', 'EUR')
  const eurParaleloHistory = historyFor('paralelo_referencial', 'EUR')

  const usdBcv = latestOf(usdBcvHistory)
  const usdParalelo = latestOf(usdParaleloHistory)
  const eurBcv = latestOf(eurBcvHistory)
  const eurParalelo = latestOf(eurParaleloHistory)

  const usdDiffPct =
    usdBcv && usdParalelo ? (((usdParalelo.rate - usdBcv.rate) / usdBcv.rate) * 100).toFixed(1) : null

  // Brecha cambiaria: for each real parallel-rate capture, pair it with the most
  // recent real BCV oficial capture on or before that date (BCV publishes less
  // often than the parallel monitor), then compute the real gap. Never fabricates
  // or interpolates a value — every point pairs two genuinely observed rates.
  const buildGapSeries = (bcvHistory: RateRow[], paraleloHistory: RateRow[]) => {
    const bcvSorted = [...bcvHistory].sort((a, b) => a.effective_date.localeCompare(b.effective_date))
    let bcvIdx = 0
    let lastBcv: RateRow | null = null
    const out: { effective_date: string; bcv_date: string; gap_pct: number; gap_bs: number }[] = []
    for (const p of paraleloHistory) {
      while (bcvIdx < bcvSorted.length && bcvSorted[bcvIdx].effective_date <= p.effective_date) {
        lastBcv = bcvSorted[bcvIdx]
        bcvIdx += 1
      }
      if (lastBcv) {
        out.push({
          effective_date: p.effective_date,
          bcv_date: lastBcv.effective_date,
          gap_pct: ((p.rate - lastBcv.rate) / lastBcv.rate) * 100,
          gap_bs: p.rate - lastBcv.rate,
        })
      }
    }
    return out
  }

  const usdGapSeriesFull = buildGapSeries(usdBcvHistory, usdParaleloHistory)
  const usdGapSeries = filterByRange(usdGapSeriesFull, range)

  const usdBcvChartHistory = filterByRange(usdBcvHistory, range)
  const usdParaleloChartHistory = filterByRange(usdParaleloHistory, range)
  const eurBcvChartHistory = filterByRange(eurBcvHistory, range)
  const eurParaleloChartHistory = filterByRange(eurParaleloHistory, range)

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-3 py-1 text-xs font-medium text-[#3B6D11]">
        Indicadores
      </span>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Tipo de cambio</h1>
      <p className="mb-8 max-w-xl text-gray-600">
        Comparamos la tasa oficial del Banco Central de Venezuela con una tasa de referencia del
        mercado paralelo, siempre citando la fuente exacta y la fecha de cada dato. Capturamos una
        foto real de cada tasa todos los días para construir una tendencia genuina — nunca
        estimamos ni rellenamos días que no observamos directamente.
      </p>

      <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <p className="mb-3 text-sm font-medium text-gray-700">
          Recibe un correo cuando la tasa se mueva más de lo normal
        </p>
        <AlertSubscribeForm
          mode="exchange_rate"
          rateOptions={[
            { rate_type: 'bcv_oficial', base_currency: 'USD', label: 'Oficial BCV (USD)' },
            { rate_type: 'paralelo_referencial', base_currency: 'USD', label: 'Paralela (USD)' },
            { rate_type: 'bcv_oficial', base_currency: 'EUR', label: 'Oficial BCV (EUR)' },
          ]}
        />
      </div>

      <AdSlot placementSlug="indicadores_top" className="mb-8" />

      {status === 'loading' ? <p className="text-gray-500">Cargando…</p> : null}

      {status === 'error' ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar los indicadores ({errorMsg}).
        </p>
      ) : null}

      {status === 'ready' ? (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Rango de los gráficos
            </p>
            <RangeSelector value={range} onChange={setRange} />
          </div>

          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Dólar (USD)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RateCard title="Tasa oficial BCV" bg="bg-[#F4FBF8]" currencyLabel="USD" row={usdBcv} history={usdBcvChartHistory} />
            <RateCard
              title="Tasa paralela (referencial)"
              bg="bg-[#FDF6EA]"
              currencyLabel="USD"
              row={usdParalelo}
              history={usdParaleloChartHistory}
            />
          </div>

          {usdDiffPct ? (
            <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Brecha cambiaria (paralelo vs. oficial)
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {usdDiffPct}%
                <span className="ml-1 text-sm font-normal text-gray-500">por encima de la oficial</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Cada punto compara la tasa paralela real de ese día con la última tasa oficial BCV
                publicada hasta esa fecha.
              </p>
              <div className="mt-4">
                <ExchangeRateGapChart points={usdGapSeries} />
              </div>
            </div>
          ) : null}

          <p className="mb-3 mt-10 text-xs font-medium uppercase tracking-wide text-gray-400">Euro (EUR)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RateCard title="Tasa oficial BCV" bg="bg-[#EEF6FC]" currencyLabel="EUR" row={eurBcv} history={eurBcvChartHistory} />
            {eurParalelo ? (
              <RateCard
                title="Tasa paralela (referencial)"
                bg="bg-[#FDF6EA]"
                currencyLabel="EUR"
                row={eurParalelo}
                history={eurParaleloChartHistory}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tasa paralela (referencial)
                </p>
                <p className="text-sm text-gray-500">
                  No mostramos una cifra de mercado paralelo para el euro: los monitores de mercado que
                  revisamos republican el mismo dato del BCV en lugar de una cotización propia, así que
                  no hay una fuente independiente que citar. Solo publicamos números que podemos
                  respaldar con su fuente exacta.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-gray-100 px-5 py-4 text-xs text-gray-500">
            <p className="mb-1 font-medium text-gray-600">Sobre estas cifras</p>
            <p>
              La tasa BCV es el tipo de cambio de referencia oficial: el promedio ponderado de las
              operaciones diarias de las mesas de cambio de la banca. La tasa paralela es una
              referencia del mercado informal (no regulada), útil para entender la brecha
              cambiaria, pero no es una tasa oficial ni la usa la banca para sus operaciones. El
              rango de 30 días es un dato publicado por la fuente del mercado paralelo; los gráficos
              de tendencia se construyen solo con capturas diarias reales, nunca con datos
              estimados o interpolados.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
