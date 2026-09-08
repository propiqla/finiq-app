'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'
import CurrencyBadge from './CurrencyBadge'

// Products stay in this section for 14 days after first_seen_at — long enough
// to cover "this week" plus a bit of runway, short enough that it never turns
// into a stale, permanent list. first_seen_at is set once at insert and is
// protected by a DB trigger, so a routine data refresh can never make an old
// product look new again — see banking.preserve_products_first_seen_at.
const WINDOW_DAYS = 14

type ProductRow = {
  id: string
  name: string
  currency: string
  first_seen_at: string
  institutions: { name: string; slug: string } | null
  categories: { name: string; slug: string } | null
}

const formatRelative = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Hace 1 día'
  return `Hace ${days} días`
}

export default function NuevosProductos() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabaseBanking
        .from('products')
        .select('id, name, currency, first_seen_at, institutions(name, slug), categories(name, slug)')
        .eq('active', true)
        .gte('first_seen_at', cutoff)
        .order('first_seen_at', { ascending: false })
        .limit(8)

      if (cancelled) return
      if (error) {
        setStatus('error')
        return
      }
      setProducts((data as unknown as ProductRow[]) ?? [])
      setStatus('ready')
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (status !== 'ready' || products.length === 0) return null

  return (
    <section className="pb-8">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        Nuevos productos
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={p.institutions ? `/finiq/bancos/${p.institutions.slug}` : '/finiq/categorias'}
            className="rounded-2xl border border-gray-100 bg-[#F5F0FC] p-4 transition hover:border-gray-200"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#E5DBFA] px-2 py-0.5 text-[10px] font-medium text-[#5B3DF5]">
                Nuevo
              </span>
              <span className="text-[10px] text-gray-400">{formatRelative(p.first_seen_at)}</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{p.name}</p>
            {p.institutions ? <p className="mt-0.5 text-xs text-gray-500">{p.institutions.name}</p> : null}
            <div className="mt-2 flex items-center gap-2">
              {p.categories ? <span className="text-[11px] text-gray-400">{p.categories.name}</span> : null}
              <CurrencyBadge currency={p.currency} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
