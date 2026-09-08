'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseBanking } from './lib/supabase-banking'
import IntentGrid from './components/IntentGrid'
import NuevosProductos from './components/NuevosProductos'

type Article = {
  slug: string
  title: string
  content_type: string
  reading_time_minutes: number | null
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  guia: 'Guía',
  glosario: 'Glosario',
  noticia: 'Noticia',
  comparativa: 'Comparativa',
}

export default function FinIqHome() {
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data: articleRows } = await supabaseBanking
        .from('articles')
        .select('slug, title, content_type, reading_time_minutes')
        .eq('status', 'published')
        .eq('section', 'aprende')
        .order('published_at', { ascending: false })
        .limit(3)
      if (!cancelled) setArticles(articleRows ?? [])
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-2">
      {/* Hero — leads with intent ("what do you need to do?") rather than
          institution, so the bank/producto becomes the answer, not the
          starting point. */}
      <div className="rounded-2xl bg-[#F4FBF8] px-6 py-6 sm:px-8">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-3 py-1 text-xs font-medium text-[#3B6D11]">
          Venezuela en expansión
        </span>
        <h1 className="mb-1 text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
          ¿Qué necesitas hacer?
        </h1>
        <p className="mb-5 max-w-md text-sm text-gray-600">
          Elige tu objetivo y te mostramos las mejores opciones — comparación clara y honesta,
          100% gratis.
        </p>

        <IntentGrid />

        <form
          className="mt-5 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            window.location.href = '/categorias'
          }}
        >
          <input
            type="text"
            placeholder="O escribe qué buscas — ej. cuenta en dólares"
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal-600"
          />
          <button
            type="submit"
            className="rounded-full bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Business teaser */}
      <section className="pb-6 pt-6">
        <Link
          href="/empresas"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#EEF6FC] px-5 py-3 transition hover:bg-[#E6F1FB]"
        >
          <div>
            <p className="mb-0.5 text-sm font-medium text-[#0C447C]">Productos para empresas</p>
            <p className="text-sm text-gray-600">
              Cuentas empresariales, tarjetas corporativas, financiamiento comercial y nómina
            </p>
          </div>
          <span className="text-sm font-medium text-[#0C447C]">Ver Empresas →</span>
        </Link>
      </section>

      <NuevosProductos />

      {/* Education preview */}
      {articles.length > 0 ? (
        <section className="pb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Aprende</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/aprende/${a.slug}`}
                className="rounded-2xl border border-gray-100 bg-[#F4FBF8] p-4 transition hover:border-gray-200"
              >
                <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-medium text-[#3B6D11]">
                  {CONTENT_TYPE_LABEL[a.content_type] ?? a.content_type}
                </span>
                <p className="mt-2 text-sm font-medium text-gray-900">{a.title}</p>
                {a.reading_time_minutes ? (
                  <p className="mt-1 text-xs text-gray-400">{a.reading_time_minutes} min de lectura</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  )
}
