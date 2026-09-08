'use client'

// "Explora por categoría" icon grid — pulled out of the homepage so it can
// render on every FinIQ page (below the exchange-rate ticker, per site-wide
// nav layout). Context-aware like FinIqNavBar's Personal/Empresas toggle:
// shows personal categories (display_order < 150) everywhere except
// /finiq/empresas pages, where it shows business categories
// (display_order >= 200) instead — mirrors the filtering already used by
// the homepage and the empresas page individually.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabaseBanking } from '../lib/supabase-banking'
import CategoryGraphic from './CategoryGraphic'
import { getCategoryStyle } from '../lib/categoryPresentation'

type Category = {
  id: string
  slug: string
  name: string
  icon: string | null
}

export default function CategoryMenu() {
  const pathname = usePathname()
  const isEmpresas = pathname?.startsWith('/empresas')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      let query = supabaseBanking.from('categories').select('id, slug, name, icon')
      query = isEmpresas ? query.gte('display_order', 200) : query.lt('display_order', 150)
      const { data } = await query.order('display_order').limit(12)
      if (!cancelled) setCategories(data ?? [])
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isEmpresas])

  if (categories.length === 0) return null

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          Explora por categoría
        </p>
        <div className="flex snap-x gap-4 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const style = getCategoryStyle(cat.slug)
            return (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="group flex w-20 shrink-0 snap-start flex-col items-center gap-2 text-center"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition group-hover:opacity-85 ${style.solid}`}
                >
                  <CategoryGraphic slug={cat.slug} className="h-7 w-7 text-white" />
                </div>
                <p className="text-xs font-medium leading-tight text-gray-700">{cat.name}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
