'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'
import CategoryGraphic from '../components/CategoryGraphic'
import { getCategoryStyle } from '../lib/categoryPresentation'

type Category = {
  id: string
  slug: string
  name: string
  description: string | null
}

export default function CategoriasIndex() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabaseBanking
        .from('categories')
        .select('id, slug, name, description')
        .lt('display_order', 150)
        .order('display_order')
      if (cancelled) return
      if (error) {
        setError(error.message)
        return
      }
      setCategories(data ?? [])
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Todas las categorías</h1>
      <p className="mb-8 text-gray-600">Elige lo que quieres comparar.</p>

      {error ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar las categorías ({error}).
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((cat) => {
            const style = getCategoryStyle(cat.slug)
            return (
              <Link
                key={cat.id}
                href={`/finiq/categorias/${cat.slug}`}
                className={`rounded-2xl border border-gray-100 p-5 transition hover:border-gray-200 ${style.bg}`}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${style.iconBg}`}>
                  <CategoryGraphic slug={cat.slug} className={`h-5 w-5 ${style.text}`} />
                </div>
                <p className="mb-1 font-medium text-gray-900">{cat.name}</p>
                {cat.description ? <p className="text-sm text-gray-600">{cat.description}</p> : null}
              </Link>
            )
          })}
        </div>
      )}

      <Link
        href="/finiq/empresas"
        className="mt-8 flex items-center justify-between rounded-2xl bg-[#EEF6FC] px-5 py-4 text-sm font-medium text-[#0C447C] transition hover:bg-[#E6F1FB]"
      >
        Buscas productos para tu empresa? <span>Ver Empresas →</span>
      </Link>
    </div>
  )
}
