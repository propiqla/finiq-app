'use client'

// FinIQ's first "decision engine" journey (Phase 1, item 3 of the roadmap):
// instead of a plain comparison table, this takes a financing need (property
// value + down payment + optional income) and scores/ranks actual mortgage
// products against it — recommendation, not just comparison. Each result
// surfaces the "verified data" standard (rate, last verified, source,
// confidence) called for in the same feedback, since most Venezuelan banks
// don't publish hard eligibility numbers and that gap should be visible
// rather than papered over.
//
// This is intentionally a form, not free-text NLP extraction — understanding
// "necesito $100,000 para un apartamento en Caracas" as text is a separate,
// later phase. The form captures the same three inputs (amount, and here
// down payment + income as the qualification proxies) in a structured way.

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'
import CurrencyBadge from '../components/CurrencyBadge'

type Eligibility = {
  max_financing_percent?: number
  min_faov_contributions_months?: number
  min_faov_favv_contributions_months?: number
  max_installment_percent_income?: number
  min_installment_percent_income?: number
  administrative_fee_percent?: number
  cannot_already_own_primary_residence?: boolean
  note?: string
} | null

type MortgageProduct = {
  id: string
  name: string
  slug: string | null
  currency: string
  interest_rate: number | null
  interest_rate_type: string | null
  loan_term_max_months: number | null
  min_down_payment_percent: number | null
  max_financing_percent: number | null
  min_income_usd: number | null
  eligibility: Eligibility
  requirements: string[] | null
  data_confidence: string | null
  source_url: string | null
  source_scraped_at: string | null
  how_to_apply_url: string | null
  institutions: { slug: string; name: string } | null
}

type Scored = MortgageProduct & { matchLevel: 'fuerte' | 'posible' | 'no_cumple' }

const CONFIDENCE_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }
const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-[#EAF3DE] text-[#3B6D11]',
  medium: 'bg-[#FDF6EA] text-[#854F0B]',
  low: 'bg-[#FAECE7] text-[#993C1D]',
}

const MATCH_LABEL: Record<Scored['matchLevel'], string> = {
  fuerte: 'Match fuerte',
  posible: 'Match posible',
  no_cumple: 'No cumple un criterio conocido',
}
const MATCH_STYLE: Record<Scored['matchLevel'], string> = {
  fuerte: 'bg-[#EAF3DE] text-[#3B6D11]',
  posible: 'bg-[#E6F1FB] text-[#185FA5]',
  no_cumple: 'bg-gray-100 text-gray-500',
}

function scoreProduct(p: MortgageProduct, downPaymentPercent: number, monthlyIncome: number | null): Scored {
  let hasFailure = false
  let hasConfirmed = false

  if (p.min_down_payment_percent != null) {
    if (downPaymentPercent + 0.001 < p.min_down_payment_percent) hasFailure = true
    else hasConfirmed = true
  }
  if (p.max_financing_percent != null) {
    const financingPercent = 100 - downPaymentPercent
    if (financingPercent > p.max_financing_percent + 0.001) hasFailure = true
    else hasConfirmed = true
  }
  if (p.min_income_usd != null && monthlyIncome != null) {
    if (monthlyIncome < p.min_income_usd) hasFailure = true
    else hasConfirmed = true
  }

  const matchLevel: Scored['matchLevel'] = hasFailure ? 'no_cumple' : hasConfirmed ? 'fuerte' : 'posible'
  return { ...p, matchLevel }
}

const fmtUsd = (n: number) => `$${n.toLocaleString('es-VE', { maximumFractionDigits: 0 })}`

export default function FinanciarPropiedadClient() {
  const [propertyValue, setPropertyValue] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [results, setResults] = useState<Scored[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const value = Number(propertyValue) || 0
  const down = Number(downPayment) || 0
  const income = monthlyIncome ? Number(monthlyIncome) : null
  const financingNeeded = Math.max(value - down, 0)
  const downPaymentPercent = value > 0 ? (down / value) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (value <= 0) return
    setLoading(true)
    setError(null)

    const { data: cat, error: catErr } = await supabaseBanking
      .from('categories')
      .select('id')
      .eq('slug', 'prestamos-hipotecarios')
      .maybeSingle()

    if (catErr || !cat) {
      setError(catErr?.message ?? 'No se pudo cargar la categoría de préstamos hipotecarios.')
      setLoading(false)
      return
    }

    const { data: products, error: prodErr } = await supabaseBanking
      .from('products')
      .select(
        'id, name, slug, currency, interest_rate, interest_rate_type, loan_term_max_months, min_down_payment_percent, max_financing_percent, min_income_usd, eligibility, requirements, data_confidence, source_url, source_scraped_at, how_to_apply_url, institutions(slug, name)'
      )
      .eq('category_id', (cat as { id: string }).id)
      .eq('active', true)
      .order('interest_rate', { ascending: true, nullsFirst: false })

    if (prodErr) {
      setError(prodErr.message)
      setLoading(false)
      return
    }

    const scored = ((products as unknown as MortgageProduct[]) ?? []).map((p) =>
      scoreProduct(p, downPaymentPercent, income)
    )
    const order: Record<Scored['matchLevel'], number> = { fuerte: 0, posible: 1, no_cumple: 2 }
    scored.sort((a, b) => order[a.matchLevel] - order[b.matchLevel])

    setResults(scored)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-teal-700">Comprar una propiedad</p>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900 sm:text-3xl">¿Cuánto financiamiento necesitas?</h1>
      <p className="mb-6 max-w-xl text-sm text-gray-600">
        Cuéntanos el valor de la propiedad y tu pago inicial — te mostramos qué créditos hipotecarios
        se ajustan mejor, no solo una lista de tasas.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-100 bg-[#F4FBF8] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Valor de la propiedad (USD)</span>
            <input
              type="number"
              min="0"
              required
              value={propertyValue}
              onChange={(e) => setPropertyValue(e.target.value)}
              placeholder="150000"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Pago inicial disponible (USD)</span>
            <input
              type="number"
              min="0"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="30000"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Ingreso mensual del hogar (USD, opcional)</span>
            <input
              type="number"
              min="0"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="1500"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={value <= 0 || loading}
          className="mt-4 rounded-full bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? 'Buscando…' : 'Ver opciones de financiamiento'}
        </button>
      </form>

      {error ? (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">No pudimos cargar datos en vivo ({error}).</p>
      ) : null}

      {results ? (
        <div>
          <div className="mb-5 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
            Entendemos que buscas <strong>{fmtUsd(financingNeeded)}</strong> de financiamiento inmobiliario
            {value > 0 ? (
              <>
                {' '}
                para una propiedad de {fmtUsd(value)}
                {down > 0 ? ` con un pago inicial de ${fmtUsd(down)} (${downPaymentPercent.toFixed(0)}%)` : ''}
                {income != null ? ` e ingreso mensual del hogar de ${fmtUsd(income)}` : ''}.
              </>
            ) : null}
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-gray-500">No hay créditos hipotecarios activos disponibles ahora mismo.</p>
          ) : (
            <div className="space-y-4">
              {results.map((p) => (
                <div key={p.id} className="rounded-2xl border border-gray-100 p-5">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.institutions ? (
                          <Link href={`/bancos/${p.institutions.slug}`} className="hover:text-teal-700 hover:underline">
                            {p.institutions.name}
                          </Link>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500">{p.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${MATCH_STYLE[p.matchLevel]}`}>
                      {MATCH_LABEL[p.matchLevel]}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                    <span>
                      Tasa: <strong>{p.interest_rate != null ? `${p.interest_rate}%` : '—'}</strong>
                      {p.interest_rate_type ? ` (${p.interest_rate_type})` : ''}
                    </span>
                    {p.loan_term_max_months ? <span>Plazo hasta {Math.round(p.loan_term_max_months / 12)} años</span> : null}
                    <CurrencyBadge currency={p.currency} />
                  </div>

                  {p.eligibility?.note ? <p className="mb-3 text-xs text-gray-500">{p.eligibility.note}</p> : null}

                  {p.requirements && p.requirements.length > 0 ? (
                    <details className="mb-3 text-xs text-gray-600">
                      <summary className="cursor-pointer font-medium text-gray-700">Recaudos ({p.requirements.length})</summary>
                      <ul className="mt-2 list-disc space-y-1 pl-4">
                        {p.requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                      {p.data_confidence ? (
                        <span className={`rounded-full px-2 py-0.5 font-medium ${CONFIDENCE_STYLE[p.data_confidence] ?? 'bg-gray-100 text-gray-500'}`}>
                          Confianza: {CONFIDENCE_LABEL[p.data_confidence] ?? p.data_confidence}
                        </span>
                      ) : null}
                      {p.source_scraped_at ? (
                        <span>
                          Verificado:{' '}
                          {new Date(p.source_scraped_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      ) : null}
                      {p.source_url ? (
                        <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-700 hover:underline">
                          Fuente ↗
                        </a>
                      ) : null}
                    </div>
                    {(p.how_to_apply_url ?? p.source_url) ? (
                      <a
                        href={p.how_to_apply_url ?? p.source_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-teal-600 hover:text-teal-700"
                      >
                        Ver detalles →
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
              <p className="pt-2 text-xs text-gray-400">
                Las condiciones pueden cambiar. Verifica directamente con el banco antes de aplicar.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <p className="mt-8 text-xs text-gray-400">
        ¿Prefieres ver todos los créditos hipotecarios en una tabla?{' '}
        <Link href="/categorias/prestamos-hipotecarios" className="text-teal-700 hover:underline">
          Ver comparación completa →
        </Link>
      </p>
    </div>
  )
}
