'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from '../lib/supabase-banking'

type Article = {
  slug: string
  title: string
  excerpt: string | null
  content_type: string
  reading_time_minutes: number | null
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  guia: 'Guía',
  glosario: 'Glosario',
  noticia: 'Noticia',
  comparativa: 'Comparativa',
}

export default function AprendeIndex() {
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabaseBanking
        .from('articles')
        .select('slug, title, excerpt, content_type, reading_time_minutes')
        .eq('status', 'published')
        .eq('section', 'aprende')
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
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Aprende</h1>
      <p className="mb-8 text-gray-600">
        Guías, glosario y comparativas para entender el sistema financiero venezolano.
      </p>

      {error ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar los artículos ({error}).
        </p>
      ) : articles.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
          Todavía no hay artículos publicados.
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/aprende/${a.slug}`}
              className="block rounded-2xl border border-gray-100 p-4 transition hover:border-gray-200"
            >
              <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-medium text-[#3B6D11]">
                {CONTENT_TYPE_LABEL[a.content_type] ?? a.content_type}
              </span>
              <p className="mt-2 font-medium text-gray-900">{a.title}</p>
              {a.excerpt ? <p className="mt-1 text-sm text-gray-600">{a.excerpt}</p> : null}
              {a.reading_time_minutes ? (
                <p className="mt-2 text-xs text-gray-400">{a.reading_time_minutes} min de lectura</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
