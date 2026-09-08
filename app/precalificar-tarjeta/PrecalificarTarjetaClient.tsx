'use client'

// Credit card pre-qualification engine (FinIQ decision-engine roadmap, item 5:
// recommendation/qualification). Unlike financiar-propiedad, this is a live,
// single-page form: every field updates the ranked results instantly, no
// submit button — chosen over a step-by-step wizard because most Venezuelan
// card issuers don't publish enough structured eligibility data to justify
// a longer guided flow, and a fast live list rewards exploration.
//
// Scoring reuses the same honest fuerte/posible/no_cumple pattern as
// financiar-propiedad: a field only counts as "confirmed" or "failed" when
// both the product publishes it AND the user has entered it. Most Venezuelan
// banks don't publish hard income/employment minimums (they say "sujeto a
// evaluación crediticia"), so most cards land on "posible" honestly rather
// than a fabricated "fuerte".

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'
import CurrencyBadge from '../components/CurrencyBadge'

type CardProduct = {
  id: string
  name: string
  currency: string
  interest_rate: number | null
  annual_fee_usd: number | null
  credit_limit_min_usd: number | null
  credit_limit_max_usd: number | null
  card_network: string | null
  card_tier: string | null
  requirements: string[] | null
  source_url: string | null
  source_scraped_at: string | null
  how_to_apply_url: string | null
  data_confidence: string | null
  audience: string | null
  network_scope: string | null
  affiliated_merchant: string | null
  min_income_usd: number | null
  min_employment_months: number | null
  min_age: number | null
  requires_existing_account: boolean | null
  institutions: { slug: string; name: string } | null
}

type Scored = CardProduct & { matchLevel: 'fuerte' | 'posible' | 'no_cumple' }

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

const usd = (n: number) => `$${n.toLocaleString('es-VE')}`

function scoreCard(
  p: CardProduct,
  income: number | null,
  employmentMonths: number | null,
  age: number | null,
  existingBanks: Set<string>,
  merchants: Set<string>,
  merchantsTouched: boolean
): Scored {
  let hasFailure = false
  let hasConfirmed = false

  if (p.network_scope === 'closed_loop' && merchantsTouched) {
    if (p.affiliated_merchant && merchants.has(p.affiliated_merchant)) hasConfirmed = true
    else hasFailure = true
  }

  if (p.min_income_usd != null && income != null) {
    if (income < p.min_income_usd) hasFailure = true
    else hasConfirmed = true
  }

  if (p.min_employment_months != null && employmentMonths != null) {
    if (employmentMonths < p.min_employment_months) hasFailure = true
    else hasConfirmed = true
  }

  if (p.min_age != null && age != null) {
    if (age < p.min_age) hasFailure = true
    else hasConfirmed = true
  }

  if (p.requires_existing_account === true && p.institutions && existingBanks.has(p.institutions.slug)) {
    hasConfirmed = true
  }

  const matchLevel: Scored['matchLevel'] = hasFailure ? 'no_cumple' : hasConfirmed ? 'fuerte' : 'posible'
  return { ...p, matchLevel }
}

export default function PrecalificarTarjetaClient() {
  const [audience, setAudience] = useState<'consumer' | 'business'>('consumer')
  const [income, setIncome] = useState('')
  const [employmentMonths, setEmploymentMonths] = useState('')
  const [age, setAge] = useState('')
  const [existingBanks, setExistingBanks] = useState<Set<string>>(new Set())
  const [merchants, setMerchants] = useState<Set<string>>(new Set())
  const [merchantsTouched, setMerchantsTouched] = useState(false)
  const [products, setProducts] = useState<CardProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: cats } = await supabaseBanking
        .from('categories')
        .select('id, slug')
        .in('slug', ['tarjetas-credito', 'tarjetas-corporativas'])
      const catIds = (cats ?? []).map((c) => (c as { id: string }).id)
      if (catIds.length === 0) return

      const { data, error: err } = await supabaseBanking
        .from('products')
        .select(
          'id, name, currency, interest_rate, annual_fee_usd, credit_limit_min_usd, credit_limit_max_usd, card_network, card_tier, requirements, source_url, source_scraped_at, how_to_apply_url, data_confidence, audience, network_scope, affiliated_merchant, min_income_usd, min_employment_months, min_age, requires_existing_account, institutions(slug, name)'
        )
        .in('category_id', catIds)
        .eq('active', true)

      if (cancelled) return
      if (err) setError(err.message)
      else setProducts((data as unknown as CardProduct[]) ?? [])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const scopedProducts = useMemo(() => (products ?? []).filter((p) => p.audience === audience), [products, audience])

  const accountBanks = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of scopedProducts) {
      if (p.requires_existing_account === true && p.institutions) seen.set(p.institutions.slug, p.institutions.name)
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [scopedProducts])

  const loyaltyMerchants = useMemo(() => {
    const seen = new Set<string>()
    for (const p of scopedProducts) {
      if (p.network_scope === 'closed_loop' && p.affiliated_merchant) seen.add(p.affiliated_merchant)
    }
    return Array.from(seen).sort()
  }, [scopedProducts])

  const results = useMemo(() => {
    const incomeNum = income ? Number(income) : null
    const monthsNum = employmentMonths ? Number(employmentMonths) : null
    const ageNum = age ? Number(age) : null
    const scored = scopedProducts.map((p) =>
      scoreCard(p, incomeNum, monthsNum, ageNum, existingBanks, merchants, merchantsTouched)
    )
    const order: Record<Scored['matchLevel'], number> = { fuerte: 0, posible: 1, no_cumple: 2 }
    scored.sort((a, b) => order[a.matchLevel] - order[b.matchLevel] || (a.interest_rate ?? 999) - (b.interest_rate ?? 999))
    return scored
  }, [scopedProducts, income, employmentMonths, age, existingBanks, merchants, merchantsTouched])

  const toggleSet = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-700">Conseguir una tarjeta</p>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900 sm:text-3xl">¿Para qué tarjeta calificas?</h1>
      <p className="mb-6 max-w-xl text-sm text-gray-600">
        Cuéntanos un poco sobre ti — te mostramos qué tarjetas se ajustan mejor a tu perfil, no solo una
        lista completa. Los resultados se actualizan mientras escribes.
      </p>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-[#FDF6EA] p-5 sm:p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setAudience('consumer')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              audience === 'consumer' ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setAudience('business')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              audience === 'business' ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Para mi negocio
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Ingreso mensual (USD, opcional)</span>
            <input
              type="number"
              min="0"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="600"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Meses en tu empleo actual (opcional)</span>
            <input
              type="number"
              min="0"
              value={employmentMonths}
              onChange={(e) => setEmploymentMonths(e.target.value)}
              placeholder="12"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Edad (opcional)</span>
            <input
              type="number"
              min="0"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600"
            />
          </label>
        </div>

        {accountBanks.length > 0 ? (
          <div className="mt-4">
            <span className="mb-2 block text-xs font-medium text-gray-500">
              ¿Ya tienes cuenta en alguno de estos bancos? (opcional)
            </span>
            <div className="flex flex-wrap gap-2">
              {accountBanks.map(([slug, name]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggleSet(existingBanks, setExistingBanks, slug)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    existingBanks.has(slug) ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {loyaltyMerchants.length > 0 ? (
          <div className="mt-4">
            <span className="mb-2 block text-xs font-medium text-gray-500">
              ¿Compras habitualmente en alguna de estas tiendas? (opcional — hay tarjetas de uso exclusivo)
            </span>
            <div className="flex flex-wrap gap-2">
              {loyaltyMerchants.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMerchantsTouched(true)
                    toggleSet(merchants, setMerchants, m)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    merchants.has(m) ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">No pudimos cargar datos en vivo ({error}).</p>
      ) : null}

      {products === null ? (
        <p className="text-sm text-gray-500">Cargando tarjetas…</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-500">No hay tarjetas activas disponibles ahora mismo en esta categoría.</p>
      ) : (
        <div className="space-y-4">
          {results.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gray-100 p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {p.institutions ? (
                      <Link href={`/finiq/bancos/${p.institutions.slug}`} className="hover:text-amber-700 hover:underline">
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
                {p.card_network ? <span>{p.card_network}</span> : null}
                {p.card_tier ? <span>{p.card_tier}</span> : null}
                {p.annual_fee_usd != null ? (
                  <span>Anualidad: <strong>{p.annual_fee_usd === 0 ? 'Gratis' : usd(p.annual_fee_usd)}</strong></span>
                ) : null}
                {p.credit_limit_min_usd != null || p.credit_limit_max_usd != null ? (
                  <span>
                    Límite:{' '}
                    <strong>
                      {p.credit_limit_min_usd != null && p.credit_limit_max_usd != null
                        ? `${usd(p.credit_limit_min_usd)} – ${usd(p.credit_limit_max_usd)}`
                        : p.credit_limit_min_usd != null
                        ? `Desde ${usd(p.credit_limit_min_usd)}`
                        : `Hasta ${usd(p.credit_limit_max_usd as number)}`}
                    </strong>
                  </span>
                ) : null}
                <CurrencyBadge currency={p.currency} />
                {p.network_scope === 'closed_loop' ? (
                  <span className="rounded-full bg-[#FAECE7] px-2 py-0.5 text-[10px] font-medium text-[#993C1D]">
                    Uso exclusivo{p.affiliated_merchant ? ` en ${p.affiliated_merchant}` : ''}
                  </span>
                ) : p.network_scope === 'open_loop_affinity' ? (
                  <span className="rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-medium text-[#185FA5]">
                    Afinidad{p.affiliated_merchant ? `: ${p.affiliated_merchant}` : ''}
                  </span>
                ) : null}
              </div>

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
                    <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 hover:underline">
                      Fuente ↗
                    </a>
                  ) : null}
                </div>
                {(p.how_to_apply_url ?? p.source_url) ? (
                  <a
                    href={p.how_to_apply_url ?? p.source_url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-amber-600 hover:text-amber-700"
                  >
                    Ver detalles →
                  </a>
                ) : null}
              </div>
            </div>
          ))}
          <p className="pt-2 text-xs text-gray-400">
            Un "Match fuerte" solo significa que cumples los criterios que el banco publica — la aprobación
            final siempre depende de su evaluación interna. La mayoría de los bancos en Venezuela no publican
            mínimos de ingreso o antigüedad laboral, así que muchas tarjetas quedan honestamente en "Match
            posible" en vez de fabricar una certeza que no tenemos.
          </p>
        </div>
      )}

      <p className="mt-8 text-xs text-gray-400">
        ¿Prefieres ver todas las tarjetas en una tabla?{' '}
        <Link href="/finiq/categorias/tarjetas-credito" className="text-amber-700 hover:underline">
          Ver comparación completa →
        </Link>
      </p>
    </div>
  )
}
