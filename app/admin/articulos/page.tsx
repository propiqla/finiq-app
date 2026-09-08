'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { supabaseBanking } from '../../lib/supabase-banking'

type Article = {
  id: string
  slug: string
  title: string
  section: string
  content_type: string
  status: string
  published_at: string | null
  updated_at: string | null
}

const SECTION_LABEL: Record<string, string> = { aprende: 'Aprende', actualidad: 'Actualidad' }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ArticlesAdmin() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'unauthorized' | 'ready'>('checking')
  const [articles, setArticles] = useState<Article[]>([])
  const [sectionFilter, setSectionFilter] = useState<'all' | 'aprende' | 'actualidad'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data: agent } = await supabase
        .from('agents')
        .select('role')
        .eq('email', session.user.email ?? '')
        .maybeSingle()

      if (cancelled) return
      if (!agent || (agent as { role: string | null }).role !== 'admin') {
        setStatus('unauthorized')
        return
      }

      setStatus('ready')
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (status !== 'ready') return
    let cancelled = false
    const loadArticles = async () => {
      setLoading(true)
      const { data } = await supabaseBanking
        .from('articles')
        .select('id, slug, title, section, content_type, status, published_at, updated_at')
        .order('updated_at', { ascending: false })
      if (cancelled) return
      setArticles((data as Article[]) ?? [])
      setLoading(false)
    }
    void loadArticles()
    return () => {
      cancelled = true
    }
  }, [status])

  const handleToggleStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    const update: Record<string, string | null> = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'published' && !article.published_at) {
      update.published_at = new Date().toISOString()
    }
    const { error } = await supabaseBanking.from('articles').update(update).eq('id', article.id)
    if (!error) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? { ...a, status: newStatus, published_at: update.published_at ?? a.published_at }
            : a,
        ),
      )
    }
  }

  const handleDelete = async (article: Article) => {
    if (!confirm(`¿Eliminar "${article.title}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabaseBanking.from('articles').delete().eq('id', article.id)
    if (!error) setArticles((prev) => prev.filter((a) => a.id !== article.id))
  }

  if (status === 'checking') {
    return <div className="mx-auto max-w-5xl px-6 py-10 text-gray-500">Verificando acceso…</div>
  }

  if (status === 'unauthorized') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">No tienes acceso a esta página.</p>
      </div>
    )
  }

  const filtered = sectionFilter === 'all' ? articles : articles.filter((a) => a.section === sectionFilter)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Artículos</h1>
          <p className="mt-1 text-sm text-gray-600">Contenido de Aprende y Actualidad.</p>
        </div>
        <Link
          href="/finiq/admin/articulos/nuevo"
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          + Nuevo artículo
        </Link>
      </div>

      <div className="mb-6 flex gap-1 rounded-full bg-gray-100 p-1 text-sm w-fit">
        {(['all', 'aprende', 'actualidad'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSectionFilter(s)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              sectionFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'Todos' : SECTION_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 py-16 text-center text-sm text-gray-500">
          No hay artículos todavía.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sección</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Actualizado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{a.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{a.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{SECTION_LABEL[a.section] ?? a.section}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{a.content_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        a.status === 'published' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {a.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">{formatDate(a.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/finiq/admin/articulos/${a.id}`}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-teal-400 hover:text-teal-700"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(a)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          a.status === 'published'
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            : 'border-teal-200 text-teal-600 hover:bg-teal-50'
                        }`}
                      >
                        {a.status === 'published' ? 'Despublicar' : 'Publicar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a)}
                        className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
