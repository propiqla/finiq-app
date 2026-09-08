'use client'

import { useState } from 'react'
import Link from 'next/link'
import CurrencyBadge from './CurrencyBadge'
import InstitutionLogo from './InstitutionLogo'
import { getColumnsForCategory, type ProductForColumns } from '../lib/productColumns'

export type ProductCardData = ProductForColumns & {
  id: string
  name: string
  currency: string
  source_url: string | null
  how_to_apply_url: string | null
  data_confidence: string
  image_url: string | null
  institutions: { slug: string; name: string; website?: string | null; supports_pago_movil: boolean } | null
  requirements: string[] | null
  disclosure_label?: string
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s)

// The card's own visual — a real product photo when we have one, otherwise
// a stylized panel built from the institution's logo. Either way, this is
// purely illustrative: it's never itself a link. The whole point of this
// component is that "seeing the card" and "leaving the site" are two
// different actions now, not one click.
function ProductVisual({ p }: { p: ProductCardData }) {
  if (p.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.image_url}
        alt={p.name}
        className="h-16 w-24 shrink-0 rounded-lg border border-gray-100 object-cover sm:h-20 sm:w-28"
      />
    )
  }
  return (
    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 sm:h-20 sm:w-28">
      <InstitutionLogo
        name={p.institutions?.name ?? ''}
        website={p.institutions?.website ?? null}
        className="h-9 w-9"
      />
    </div>
  )
}

export default function ProductCard({
  product: p,
  categorySlug,
  highlight,
}: {
  product: ProductCardData
  categorySlug: string
  highlight?: boolean
}) {
  const [showRecaudos, setShowRecaudos] = useState(false)
  const productUrl = p.how_to_apply_url ?? p.source_url
  const columns = getColumnsForCategory(categorySlug)

  return (
    <div
      className={`rounded-2xl border p-5 ${
        p.disclosure_label
          ? 'border-[#F3E4BE] bg-[#FDF6EA]'
          : highlight
          ? 'border-teal-200 bg-[#F4FBF8]'
          : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <ProductVisual p={p} />

        <div className="min-w-[200px] flex-1">
          <p className="text-xs font-medium text-gray-500">{p.institutions?.name ?? '—'}</p>
          <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CurrencyBadge currency={p.currency} />
            {p.card_network ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {p.card_network}
              </span>
            ) : null}
            {highlight ? (
              <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-medium text-[#3B6D11]">
                Mejor tasa
              </span>
            ) : null}
            {p.disclosure_label ? (
              <span className="rounded-full bg-[#FAEEDA] px-2 py-0.5 text-[10px] font-medium text-[#854F0B]">
                {p.disclosure_label}
              </span>
            ) : null}
            {p.data_confidence === 'low' ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                Dato preliminar
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {p.description ? (
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{truncate(p.description, 260)}</p>
      ) : null}

      {columns.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.key}>
              <p className="text-[11px] text-gray-400">{col.header}</p>
              <p className="text-sm font-medium text-gray-800">{col.render(p)}</p>
            </div>
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
            Ver en el sitio del banco ↗
          </a>
        ) : null}
        {p.institutions ? (
          <Link
            href={`/bancos/${p.institutions.slug}`}
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
