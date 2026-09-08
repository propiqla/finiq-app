'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../../lib/supabase-banking'
import InstitutionLogo from '../../components/InstitutionLogo'
import CurrencyBadge from '../../components/CurrencyBadge'

type Institution = {
  id: string
  slug: string
  name: string
  institution_type: string
  regulator: string | null
  headquarters_city: string | null
  description: string | null
  supports_usd: boolean
  supports_pago_movil: boolean
  verified: boolean
  app_store_rating: number | null
  play_store_rating: number | null
  website: string | null
}

type ProductRow = {
  id: string
  name: string
  slug: string
  currency: string
  interest_rate: number | null
  monthly_fee_usd: number | null
  source_url: string | null
  how_to_apply_url: string | null
  audience: string
  categories: { slug: string; name: string } | null
  description: string | null
  image_url: string | null
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s)

export default function BankProfileClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: inst, error: instErr } = await supabaseBanking
        .from('institutions')
        .select(
          'id, slug, name, institution_type, regulator, headquarters_city, description, supports_usd, supports_pago_movil, verified, app_store_rating, play_store_rating, website'
        )
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled) return
      if (instErr) {
        setStatus('error')
        setErrorMsg(instErr.message)
        return
      }
      if (!inst) {
        setStatus('not_found')
        return
      }
      setInstitution(inst)

      const { data: productRows } = await supabaseBanking
        .from('products')
        .select('id, name, slug, currency, interest_rate, monthly_fee_usd, source_url, how_to_apply_url, audience, description, image_url, categories(slug, name)')
        .eq('institution_id', inst.id)
        .eq('active', true)

      if (!cancelled) setProducts((productRows as unknown as ProductRow[]) ?? [])
      if (!cancelled) setStatus('ready')
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (status === 'loading') {
    return <div className="mx-auto max-w-4xl px-6 py-10 text-gray-500">Cargando…</div>
  }

  if (status === 'not_found') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-gray-700">No encontramos esta institución.</p>
        <Link href="/categorias" className="mt-2 inline-block text-teal-700">
          Ver categorías →
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar esta institución ({errorMsg}).
        </p>
      </div>
    )
  }

  const consumerProducts = products.filter((p) => p.audience === 'consumer')
  const businessProducts = products.filter((p) => p.audience === 'business')

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {institution ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FinancialService',
              name: institution.name,
              url: institution.website ?? undefined,
              description: institution.description ?? undefined,
              areaServed: 'VE',
              additionalType: institution.institution_type ?? undefined,
            }),
          }}
        />
      ) : null}
      <div className="mb-8 flex items-start gap-4">
        <InstitutionLogo
          name={institution?.name ?? ''}
          website={institution?.website ?? null}
          className="h-12 w-12 shrink-0"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{institution?.name}</h1>
            {institution?.verified ? (
              <span className="rounded-full bg-[#EAF3DE] px-2.5 py-0.5 text-xs font-medium text-[#3B6D11]">
                Verificado {institution.regulator ?? ''}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {[
              institution?.headquarters_city,
              institution?.supports_usd ? 'USD y Bs' : 'Bs',
              institution?.supports_pago_movil ? 'Pago Móvil' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {institution?.description ? (
            <p className="mt-3 max-w-xl text-sm text-gray-600">{institution.description}</p>
          ) : null}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
        Productos personales
      </h2>
      {consumerProducts.length === 0 ? (
        <p className="mb-8 rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
          Todavía no tenemos productos verificados de esta institución.
        </p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {consumerProducts.map((p) => {
            const productUrl = p.how_to_apply_url ?? p.source_url
            return (
              <div key={p.id} className="rounded-xl border border-gray-100 p-4 transition hover:border-gray-200">
                <div className="flex items-start gap-3">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-12 w-16 shrink-0 rounded-md border border-gray-100 object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/categorias/${p.categories?.slug ?? ''}`}
                        className="text-xs text-gray-400 hover:text-teal-700 hover:underline"
                      >
                        {p.categories?.name}
                      </Link>
                      <CurrencyBadge currency={p.currency} />
                    </div>
                    <p className="mt-1 font-medium text-gray-900">{p.name}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  {p.interest_rate != null ? `${p.interest_rate}% · ` : ''}
                  {p.monthly_fee_usd != null ? `$${p.monthly_fee_usd}/mes` : 'Mantenimiento no verificado'}
                </p>
                {p.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{truncate(p.description, 140)}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/categorias/${p.categories?.slug ?? ''}`}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-teal-600 hover:text-teal-700"
                  >
                    Ver detalles →
                  </Link>
                  {productUrl ? (
                    <a
                      href={productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-gray-500 hover:text-teal-700 hover:underline"
                    >
                      Ver en el sitio del banco ↗
                    </a>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {businessProducts.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
            Productos empresariales
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {businessProducts.map((p) => {
              const productUrl = p.how_to_apply_url ?? p.source_url
              return (
                <div key={p.id} className="rounded-xl border border-gray-100 p-4 transition hover:border-gray-200">
                  <div className="flex items-start gap-3">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-12 w-16 shrink-0 rounded-md border border-gray-100 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <Link
                        href="/empresas"
                        className="text-xs text-gray-400 hover:text-teal-700 hover:underline"
                      >
                        {p.categories?.name}
                      </Link>
                      <p className="mt-1 font-medium text-gray-900">{p.name}</p>
                    </div>
                  </div>
                  {p.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{truncate(p.description, 140)}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href="/empresas"
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:border-teal-600 hover:text-teal-700"
                    >
                      Ver detalles →
                    </Link>
                    {productUrl ? (
                      <a
                        href={productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gray-500 hover:text-teal-700 hover:underline"
                      >
                        Ver en el sitio del banco ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
