'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CurrencyBadge from './CurrencyBadge'

export type CardBenefit = { category: string; name: string; detail: string | null }

export type CardProduct = {
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
  how_to_apply_url: string | null
  data_confidence: string
  institutions: { slug: string; name: string } | null
  benefits: CardBenefit[]
  disclosure_label?: string
  network_scope: string | null
  affiliated_merchant: string | null
}

const BENEFIT_CATEGORY_LABEL: Record<string, string> = {
  viajes: 'Viajes',
  compras: 'Compras',
  financiamiento: 'Financiamiento',
  proteccion_compras: 'Protección de compras',
  recompensas: 'Recompensas',
  entretenimiento: 'Entretenimiento',
  restaurantes: 'Restaurantes',
  salud: 'Salud',
  combustible: 'Combustible',
  sin_comisiones: 'Sin comisiones',
}

const usd = (n: number) => `$${n.toLocaleString('es-VE')}`

const limitRange = (min: number | null, max: number | null) => {
  if (min == null && max == null) return '—'
  if (min != null && max != null) return min === max ? usd(min) : `${usd(min)} – ${usd(max)}`
  if (min != null) return `Desde ${usd(min)}`
  return `Hasta ${usd(max as number)}`
}

type SortKey = 'relevance' | 'annual_fee' | 'limit' | 'benefits'

function CardTile({ p, highlight }: { p: CardProduct; highlight?: boolean }) {
  const [showRecaudos, setShowRecaudos] = useState(false)
  const productUrl = p.how_to_apply_url ?? p.source_url

  return (
    <div
      className={`rounded-2xl border p-5 ${
        p.disclosure_label ? 'border-[#F3E4BE] bg-[#FDF6EA]' : highlight ? 'border-teal-200 bg-[#F4FBF8]' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{p.institutions?.name ?? '—'}</p>
          <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CurrencyBadge currency={p.currency} />
            {p.card_network ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {p.card_network}
              </span>
            ) : null}
            {p.card_tier ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {p.card_tier}
              </span>
            ) : null}
            {p.disclosure_label ? (
              <span className="rounded-full bg-[#FAEEDA] px-2 py-0.5 text-[10px] font-medium text-[#854F0B]">
                {p.disclosure_label}
              </span>
            ) : null}
            {p.network_scope === 'closed_loop' ? (
              <span className="rounded-full bg-[#FAECE7] px-2 py-0.5 text-[10px] font-medium text-[#993C1D]">
                Uso exclusivo{p.affiliated_merchant ? ` en ${p.affiliated_merchant}` : ''}
              </span>
            ) : p.network_scope === 'open_loop_affinity' ? (
              <span className="rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-medium text-[#185FA5]">
                Afinidad{p.affiliated_merchant ? `: ${p.affiliated_merchant}` : ''}
              </span>
            ) : null}
            {p.data_confidence === 'low' ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                Dato preliminar
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-4 text-right text-sm">
          <div>
            <p className="text-[11px] text-gray-400">Tasa</p>
            <p className="font-medium text-gray-800">{p.interest_rate != null ? `${p.interest_rate}%` : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Anualidad</p>
            <p className="font-medium text-gray-800">
              {p.annual_fee_usd != null ? (p.annual_fee_usd === 0 ? 'Sin anualidad' : usd(p.annual_fee_usd)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Límite</p>
            <p className="font-medium text-gray-800">{limitRange(p.credit_limit_min_usd, p.credit_limit_max_usd)}</p>
          </div>
        </div>
      </div>

      {p.benefits.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.benefits.map((b, i) => (
            <span
              key={`${p.id}-benefit-${i}`}
              title={b.detail ?? undefined}
              className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800"
            >
              {b.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {productUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#0D3B36] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#0a2e2a]"
          >
            Ver tarjeta ↗
          </a>
        ) : null}
        {p.institutions ? (
          <Link
            href={`/finiq/bancos/${p.institutions.slug}`}
            className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-700 hover:border-teal-600 hover:text-teal-700"
          >
            Ver banco →
          </Link>
        ) : null}
        {p.requirements && p.requirements.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowRecaudos((v) => !v)}
            className="text-xs font-medium text-gray-500 hover:text-teal-700 hover:underline"
          >
            {showRecaudos ? 'Ocultar recaudos' : `Ver recaudos (${p.requirements.length})`}
          </button>
        ) : null}
      </div>

      {showRecaudos && p.requirements ? (
        <ul className="mt-3 list-disc space-y-1 rounded-xl bg-gray-50 px-8 py-3 text-xs text-gray-600">
          {p.requirements.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function CreditCardBoard({
  products,
  sponsoredProducts,
  bestRateId,
}: {
  products: CardProduct[]
  sponsoredProducts: CardProduct[]
  bestRateId: string | null
}) {
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('relevance')

  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) for (const b of p.benefits) set.add(b.category)
    return Array.from(set).sort((a, b) => (BENEFIT_CATEGORY_LABEL[a] ?? a).localeCompare(BENEFIT_CATEGORY_LABEL[b] ?? b))
  }, [products])

  const toggleCategory = (cat: string) =>
    setActiveCategories((cur) => (cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat]))

  const filtered = useMemo(() => {
    if (activeCategories.length === 0) return products
    return products.filter((p) => p.benefits.some((b) => activeCategories.includes(b.category)))
  }, [products, activeCategories])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === 'annual_fee') {
      arr.sort((a, b) => (a.annual_fee_usd ?? Infinity) - (b.annual_fee_usd ?? Infinity))
    } else if (sortBy === 'limit') {
      arr.sort((a, b) => (b.credit_limit_max_usd ?? -Infinity) - (a.credit_limit_max_usd ?? -Infinity))
    } else if (sortBy === 'benefits') {
      arr.sort((a, b) => b.benefits.length - a.benefits.length)
    }
    // General-purpose cards first regardless of sort mode — a merchant-
    // exclusive or affinity card "winning" a rate/limit/benefits comparison
    // against cards usable anywhere would be an apples-to-oranges result.
    arr.sort((a, b) => Number(!!a.network_scope) - Number(!!b.network_scope))
    return arr
  }, [filtered, sortBy])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeCategories.includes(cat)
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-teal-300'
              }`}
            >
              {BENEFIT_CATEGORY_LABEL[cat] ?? cat}
            </button>
          ))}
          {activeCategories.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveCategories([])}
              className="rounded-full px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-600"
            >
              Quitar filtros
            </button>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-500">
          Ordenar por
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-teal-500 focus:outline-none"
          >
            <option value="relevance">Relevancia</option>
            <option value="annual_fee">Menor anualidad</option>
            <option value="limit">Mayor límite</option>
            <option value="benefits">Más beneficios</option>
          </select>
        </label>
      </div>

      {sponsoredProducts.length === 0 && sorted.length === 0 ? (
        <p className="rounded-2xl bg-gray-50 px-5 py-8 text-center text-gray-500">
          {activeCategories.length > 0
            ? 'Ninguna tarjeta verificada coincide con esos filtros de beneficios.'
            : 'Todavía no tenemos tarjetas verificadas en esta categoría. Estamos incorporando datos — vuelve pronto.'}
        </p>
      ) : (
        <div className="space-y-3">
          {sponsoredProducts.map((p) => (
            <CardTile key={`sponsored-${p.id}`} p={p} />
          ))}
          {sorted.map((p) => (
            <CardTile key={p.id} p={p} highlight={p.id === bestRateId} />
          ))}
        </div>
      )}
    </div>
  )
}
