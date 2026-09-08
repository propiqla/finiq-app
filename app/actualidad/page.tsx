'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'

type Article = {
  slug: string
  title: string
  excerpt: string | null
  content_type: string
  published_at: string | null
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  regulacion: 'Regulación',
  tendencia: 'Tendencia',
  producto: 'Producto nuevo',
  noticia: 'Noticia',
}

const dateFormatter = new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })

export default function ActualidadIndex() {
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabaseBanking
        .from('articles')
        .select('slug, title, excerpt, content_type, published_at')
        .eq('status', 'published')
        .eq('section', 'actualidad')
        .order('published_at', { ascending: false })
      if (cancelled) return
      if (error) {
        setError(error.message)
        return
      }
      setArticles(data ?? [])
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Actualidad</h1>
      <p className="mb-8 text-gray-600">
        Cambios regulatorios y tendencias del sistema financiero venezolano, explicados en lenguaje simple.
      </p>

      {error ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar los artículos ({error}).
        </p>
      ) : articles.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
          Todavía no hay artículos publicados en Actualidad.
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/finiq/actualidad/${a.slug}`}
              className="block rounded-2xl border border-gray-100 p-4 transition hover:border-gray-200"
            >
              <span className="rounded-full bg-[#FDECD8] px-2 py-0.5 text-[10px] font-medium text-[#8A4B0A]">
                {CONTENT_TYPE_LABEL[a.content_type] ?? a.content_type}
              </span>
              <p className="mt-2 font-medium text-gray-900">{a.title}</p>
              {a.excerpt ? <p className="mt-1 text-sm text-gray-600">{a.excerpt}</p> : null}
              {a.published_at ? (
                <p className="mt-2 text-xs text-gray-400">{dateFormatter.format(new Date(a.published_at))}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
