'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'
import CategoryGraphic from '../components/CategoryGraphic'
import { getCategoryStyle } from '../lib/categoryPresentation'

type Category = { id: string; slug: string; name: string; description: string | null }

type ProductRow = {
  id: string
  name: string
  institutions: { slug: string; name: string } | null
  categories: { slug: string } | null
}

export default function EmpresasHome() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: cats, error: catsErr } = await supabaseBanking
        .from('categories')
        .select('id, slug, name, description')
        .gte('display_order', 200)
        .order('display_order')

      if (cancelled) return
      if (catsErr) {
        setError(catsErr.message)
        return
      }
      setCategories(cats ?? [])

      const { data: productRows } = await supabaseBanking
        .from('products')
        .select('id, name, institutions(slug, name), categories(slug)')
        .eq('audience', 'business')
        .eq('active', true)

      if (!cancelled) setProducts((productRows as unknown as ProductRow[]) ?? [])
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#E6F1FB] px-3 py-1 text-xs font-medium text-[#0C447C]">
        FinIQ Empresas
      </span>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Productos financieros para tu empresa
      </h1>
      <p className="mb-8 max-w-xl text-gray-600">
        Cuentas empresariales, tarjetas corporativas, financiamiento comercial, nómina y comercio
        exterior — comparados igual de claro que nuestros productos personales.
      </p>

      {error ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar las categorías empresariales ({error}).
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((cat) => {
            const catProducts = products.filter((p) => p.categories?.slug === cat.slug)
            const style = getCategoryStyle(cat.slug)
            return (
              <div key={cat.id} className={`rounded-2xl border border-gray-100 p-5 ${style.bg}`}>
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${style.iconBg}`}>
                  <CategoryGraphic slug={cat.slug} className={`h-5 w-5 ${style.text}`} />
                </div>
                <p className="mb-1 font-medium text-gray-900">{cat.name}</p>
                {cat.description ? <p className="mb-3 text-sm text-gray-600">{cat.description}</p> : null}
                {catProducts.length === 0 ? (
                  <p className="text-xs text-gray-400">Catálogo en construcción — pronto verás bancos aquí.</p>
                ) : (
                  <ul className="space-y-1">
                    {catProducts.map((p) => (
                      <li key={p.id} className="text-sm text-gray-700">
                        {p.institutions ? (
                          <Link href={`/finiq/bancos/${p.institutions.slug}`} className="hover:text-teal-700">
                            {p.institutions.name} — {p.name}
                          </Link>
                        ) : (
                          p.name
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Link href="/finiq" className="mt-8 inline-block text-sm font-medium text-teal-700">
        ← Volver a productos personales
      </Link>
    </div>
  )
}
