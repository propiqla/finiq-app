'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../../lib/supabase-banking'
import { POLICY_TYPE_LABEL } from '../../lib/productColumns'
import AdSlot from '../../components/AdSlot'
import RemittanceCalculator from '../../components/RemittanceCalculator'
import AlertSubscribeForm from '../../components/AlertSubscribeForm'
import CreditCardBoard, { type CardBenefit, type CardProduct } from '../../components/CreditCardBoard'
import ProductCard, { type ProductCardData } from '../../components/ProductCard'
import { CARD_CATEGORY_SLUGS } from '../../lib/productColumns'

type Category = { id: string; slug: string; name: string; description: string | null }

type Institution = { slug: string; name: string; supports_pago_movil: boolean }

type OriginCountry = { country_code: string; country_name: string }

type ProductRow = {
  id: string
  name: string
  slug: string
  currency: string
  interest_rate: number | null
  monthly_fee_usd: number | null
  min_opening_balance_usd: number | null
  loan_term_min_months: number | null
  loan_term_max_months: number | null
  loan_amount_min_usd: number | null
  loan_amount_max_usd: number | null
  annual_fee_usd: number | null
  credit_limit_min_usd: number | null
  credit_limit_max_usd: number | null
  min_transfer_usd: number | null
  max_transfer_usd: number | null
  transfer_fee_note: string | null
  delivery_methods: string[] | null
  avg_delivery_time: string | null
  source_url: string | null
  how_to_apply_url: string | null
  data_confidence: string
  institutions: Institution | null
  originCountries?: OriginCountry[]
  card_network: string | null
  card_tier: string | null
  requirements: string[] | null
  policy_type: string | null
  coverage_summary: string | null
  premium_usd_min: number | null
  premium_period: string | null
  investment_type: string | null
  min_investment_usd: number | null
  min_investment_ves: number | null
  return_rate_min: number | null
  return_rate_max: number | null
  return_note: string | null
  international_use: boolean | null
  contactless: boolean | null
  description: string | null
  network_scope: string | null
  affiliated_merchant: string | null
  opening_fee_usd: number | null
  reload_limit_usd: number | null
  reload_limit_period: string | null
  image_url: string | null
}

type SponsoredRow = {
  sponsorship_id: string
  institution_id: string
  product_id: string | null
  disclosure_label: string
}

export default function CategoryDetailClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [sponsoredProducts, setSponsoredProducts] = useState<(ProductRow & { disclosure_label: string })[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [originFilter, setOriginFilter] = useState<string | null>(null)
  const [amountFilter, setAmountFilter] = useState('')
  const [policyTypeFilter, setPolicyTypeFilter] = useState<string | null>(null)
  const [benefitsByProduct, setBenefitsByProduct] = useState<Map<string, CardBenefit[]>>(new Map())

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data: cat, error: catErr } = await supabaseBanking
        .from('categories')
        .select('id, slug, name, description')
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled) return
      if (catErr) {
        setStatus('error')
        setErrorMsg(catErr.message)
        return
      }
      if (!cat) {
        setStatus('not_found')
        return
      }
      setCategory(cat)

      const { data: productRows } = await supabaseBanking
        .from('products')
        .select(
          'id, name, slug, currency, interest_rate, monthly_fee_usd, min_opening_balance_usd, loan_term_min_months, loan_term_max_months, loan_amount_min_usd, loan_amount_max_usd, annual_fee_usd, credit_limit_min_usd, credit_limit_max_usd, min_transfer_usd, max_transfer_usd, transfer_fee_note, delivery_methods, avg_delivery_time, source_url, how_to_apply_url, data_confidence, card_network, card_tier, requirements, policy_type, coverage_summary, premium_usd_min, premium_period, investment_type, min_investment_usd, min_investment_ves, return_rate_min, return_rate_max, return_note, international_use, contactless, description, network_scope, affiliated_merchant, opening_fee_usd, reload_limit_usd, reload_limit_period, image_url, institutions(slug, name, supports_pago_movil)'
        )
        .eq('category_id', cat.id)
        .eq('active', true)
        .order('interest_rate', { ascending: false, nullsFirst: false })

      let organic = (productRows as unknown as ProductRow[]) ?? []

      if (slug === 'remesas' && organic.length > 0) {
        const { data: originRows } = await supabaseBanking
          .from('product_origin_countries')
          .select('product_id, country_code, country_name')
          .in(
            'product_id',
            organic.map((p) => p.id)
          )
        const byProduct = new Map<string, OriginCountry[]>()
        for (const row of (originRows as { product_id: string; country_code: string; country_name: string }[]) ?? []) {
          const list = byProduct.get(row.product_id) ?? []
          list.push({ country_code: row.country_code, country_name: row.country_name })
          byProduct.set(row.product_id, list)
        }
        organic = organic.map((p) => ({ ...p, originCountries: byProduct.get(p.id) ?? [] }))
      }

      if (cancelled) return
      setProducts(organic)

      const { data: sponsoredRows } = await supabaseBanking
        .from('sponsored_placements')
        .select('sponsorship_id, institution_id, product_id, disclosure_label')
        .eq('placement_slug', 'category_top')
        .eq('category_id', cat.id)

      let sponsoredProductIds: string[] = []

      if ((sponsoredRows as SponsoredRow[] | null)?.length) {
        const productIds = (sponsoredRows as SponsoredRow[])
          .map((r) => r.product_id)
          .filter((id): id is string => !!id)
        if (productIds.length) {
          sponsoredProductIds = productIds
          const { data: sponsoredProductRows } = await supabaseBanking
            .from('products')
            .select(
              'id, name, slug, currency, interest_rate, monthly_fee_usd, min_opening_balance_usd, loan_term_min_months, loan_term_max_months, loan_amount_min_usd, loan_amount_max_usd, annual_fee_usd, credit_limit_min_usd, credit_limit_max_usd, min_transfer_usd, max_transfer_usd, transfer_fee_note, delivery_methods, avg_delivery_time, source_url, how_to_apply_url, data_confidence, card_network, card_tier, requirements, policy_type, coverage_summary, premium_usd_min, premium_period, investment_type, min_investment_usd, min_investment_ves, return_rate_min, return_rate_max, return_note, international_use, contactless, description, network_scope, affiliated_merchant, opening_fee_usd, reload_limit_usd, reload_limit_period, image_url, institutions(slug, name, supports_pago_movil)'
            )
            .in('id', productIds)
          const merged = ((sponsoredProductRows as unknown as ProductRow[]) ?? []).map((p) => {
            const match = (sponsoredRows as SponsoredRow[]).find((s) => s.product_id === p.id)
            return { ...p, disclosure_label: match?.disclosure_label ?? 'Patrocinado' }
          })
          if (!cancelled) setSponsoredProducts(merged)
        }
      }

      if (CARD_CATEGORY_SLUGS.has(slug)) {
        const allIds = [...organic.map((p) => p.id), ...sponsoredProductIds]
        if (allIds.length > 0) {
          const { data: benefitRows } = await supabaseBanking
            .from('product_card_benefits')
            .select('product_id, detail, card_benefits(name, category)')
            .in('product_id', allIds)
          const byProduct = new Map<string, CardBenefit[]>()
          for (const row of (benefitRows as unknown as {
            product_id: string
            detail: string | null
            card_benefits: { name: string; category: string } | null
          }[]) ?? []) {
            if (!row.card_benefits) continue
            const list = byProduct.get(row.product_id) ?? []
            list.push({ category: row.card_benefits.category, name: row.card_benefits.name, detail: row.detail })
            byProduct.set(row.product_id, list)
          }
          if (!cancelled) setBenefitsByProduct(byProduct)
        }
      }

      if (!cancelled) setStatus('ready')
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (status === 'loading') {
    return <div className="mx-auto max-w-5xl px-6 py-10 text-gray-500">Cargando…</div>
  }

  if (status === 'not_found') {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-gray-700">No encontramos esta categoría.</p>
        <Link href="/categorias" className="mt-2 inline-block text-teal-700">
          Ver todas las categorías →
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar esta categoría ({errorMsg}).
        </p>
      </div>
    )
  }

  const isRemesas = slug === 'remesas'
  const isCards = CARD_CATEGORY_SLUGS.has(slug)
  const isSeguros = slug === 'seguros'

  const toCardProduct = (p: ProductRow & { disclosure_label?: string }): CardProduct => ({
    id: p.id,
    name: p.name,
    currency: p.currency,
    interest_rate: p.interest_rate,
    annual_fee_usd: p.annual_fee_usd,
    credit_limit_min_usd: p.credit_limit_min_usd,
    credit_limit_max_usd: p.credit_limit_max_usd,
    card_network: p.card_network,
    card_tier: p.card_tier,
    requirements: p.requirements,
    source_url: p.source_url,
    how_to_apply_url: p.how_to_apply_url,
    data_confidence: p.data_confidence,
    institutions: p.institutions ? { slug: p.institutions.slug, name: p.institutions.name } : null,
    benefits: benefitsByProduct.get(p.id) ?? [],
    disclosure_label: p.disclosure_label,
    network_scope: p.network_scope,
    affiliated_merchant: p.affiliated_merchant,
    description: p.description,
    image_url: p.image_url,
  })

  const toProductCardData = (p: ProductRow & { disclosure_label?: string }): ProductCardData => ({
    ...p,
    institutions: p.institutions
      ? { slug: p.institutions.slug, name: p.institutions.name, supports_pago_movil: p.institutions.supports_pago_movil }
      : null,
  })

  const availableCountries = isRemesas
    ? Array.from(
        new Map(
          products.flatMap((p) => p.originCountries ?? []).map((c) => [c.country_code, c])
        ).values()
      ).sort((a, b) => a.country_name.localeCompare(b.country_name))
    : []

  const numericAmountFilter = Number(amountFilter.replace(',', '.'))
  const validAmountFilter = Number.isFinite(numericAmountFilter) && numericAmountFilter > 0

  const availablePolicyTypes = isSeguros
    ? Array.from(new Set(products.map((p) => p.policy_type).filter((t): t is string => !!t))).sort(
        (a, b) => (POLICY_TYPE_LABEL[a] ?? a).localeCompare(POLICY_TYPE_LABEL[b] ?? b)
      )
    : []

  const visibleProducts = isRemesas
    ? products.filter((p) => {
        if (originFilter && !p.originCountries?.some((c) => c.country_code === originFilter)) return false
        if (validAmountFilter) {
          if (p.min_transfer_usd != null && numericAmountFilter < p.min_transfer_usd) return false
          if (p.max_transfer_usd != null && numericAmountFilter > p.max_transfer_usd) return false
        }
        return true
      })
    : isSeguros
    ? products.filter((p) => (policyTypeFilter ? p.policy_type === policyTypeFilter : true))
    : products

  // Merchant-exclusive/affinity cards are excluded from the "best rate"
  // highlight — a closed-loop store card "winning" that comparison against
  // general-purpose cards would be misleading, even if its rate is lower.
  const bestRateId = products.reduce<string | null>((bestId, p) => {
    if (p.interest_rate == null || p.network_scope) return bestId
    if (!bestId) return p.id
    const best = products.find((x) => x.id === bestId)
    return best && best.interest_rate != null && best.interest_rate >= p.interest_rate ? bestId : p.id
  }, null)

  const allRows = [...sponsoredProducts, ...visibleProducts]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {category && products.length > 0 ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: category.name,
              description: category.description ?? undefined,
              itemListElement: products.slice(0, 20).map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'FinancialProduct',
                  name: p.name,
                  provider: p.institutions ? { '@type': 'Organization', name: p.institutions.name } : undefined,
                  interestRate: p.interest_rate ?? undefined,
                  areaServed: 'VE',
                },
              })),
            }),
          }}
        />
      ) : null}
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">{category?.name}</h1>
      {category?.description ? <p className="mb-6 text-gray-600">{category.description}</p> : null}

      {isRemesas && products.length > 0 ? (
        <RemittanceCalculator
          availableCountries={availableCountries}
          amount={amountFilter}
          onAmountChange={setAmountFilter}
          origin={originFilter}
          onOriginChange={setOriginFilter}
        />
      ) : null}

      {isRemesas ? (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Avísame si cambian las comisiones o límites de remesas
          </p>
          <AlertSubscribeForm mode="remittance_fee" />
        </div>
      ) : null}

      {isSeguros && availablePolicyTypes.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Tipo:</span>
          <button
            type="button"
            onClick={() => setPolicyTypeFilter(null)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              policyTypeFilter === null
                ? 'bg-teal-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {availablePolicyTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPolicyTypeFilter(type)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                policyTypeFilter === type
                  ? 'bg-teal-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {POLICY_TYPE_LABEL[type] ?? type}
            </button>
          ))}
        </div>
      ) : null}

      {isCards ? (
        <CreditCardBoard
          products={visibleProducts.map(toCardProduct)}
          sponsoredProducts={sponsoredProducts.map(toCardProduct)}
          bestRateId={bestRateId}
        />
      ) : allRows.length === 0 && isRemesas && (originFilter || validAmountFilter) ? (
        <p className="rounded-2xl bg-gray-50 px-5 py-8 text-center text-gray-500">
          No encontramos servicios verificados que acepten ese envío todavía.{' '}
          <button
            type="button"
            onClick={() => {
              setOriginFilter(null)
              setAmountFilter('')
            }}
            className="text-teal-700 hover:underline"
          >
            Quitar filtros →
          </button>
        </p>
      ) : allRows.length === 0 && isSeguros && policyTypeFilter ? (
        <p className="rounded-2xl bg-gray-50 px-5 py-8 text-center text-gray-500">
          No encontramos pólizas de este tipo todavía.{' '}
          <button
            type="button"
            onClick={() => setPolicyTypeFilter(null)}
            className="text-teal-700 hover:underline"
          >
            Quitar filtro →
          </button>
        </p>
      ) : allRows.length === 0 ? (
        <p className="rounded-2xl bg-gray-50 px-5 py-8 text-center text-gray-500">
          Todavía no tenemos productos verificados en esta categoría. Estamos incorporando datos —
          vuelve pronto.
        </p>
      ) : (
        <div className="space-y-3">
          {sponsoredProducts.map((p) => (
            <ProductCard key={`sponsored-${p.id}`} product={toProductCardData(p)} categorySlug={slug} />
          ))}
          {visibleProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={toProductCardData(p)}
              categorySlug={slug}
              highlight={p.id === bestRateId}
            />
          ))}
        </div>
      )}
      {sponsoredProducts.length > 0 ? (
        <p className="mt-3 text-xs text-gray-400">
          Los resultados patrocinados están claramente etiquetados y no afectan el cálculo de
          &quot;Mejor tasa&quot;, que usa solo datos verificados.
        </p>
      ) : null}

      {category ? <AdSlot placementSlug="category_secondary" categoryId={category.id} className="mt-6" /> : null}
    </div>
  )
}
