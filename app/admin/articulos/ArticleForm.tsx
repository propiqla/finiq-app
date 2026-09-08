'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { supabaseBanking } from '../../lib/supabase-banking'

type Category = { id: string; name: string }

const SECTIONS = [
  { value: 'actualidad', label: 'Actualidad' },
  { value: 'aprende', label: 'Aprende' },
] as const

const CONTENT_TYPES_BY_SECTION: Record<string, { value: string; label: string }[]> = {
  actualidad: [
    { value: 'regulacion', label: 'Regulación' },
    { value: 'tendencia', label: 'Tendencia' },
    { value: 'producto', label: 'Producto nuevo' },
    { value: 'noticia', label: 'Noticia' },
  ],
  aprende: [
    { value: 'guia', label: 'Guía' },
    { value: 'glosario', label: 'Glosario' },
    { value: 'comparativa', label: 'Comparativa' },
    { value: 'noticia', label: 'Noticia' },
  ],
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function ArticleForm({ articleId }: { articleId?: string }) {
  const router = useRouter()
  const isEdit = Boolean(articleId)

  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthorized' | 'ready'>('checking')
  const [loadingArticle, setLoadingArticle] = useState(isEdit)
  const [categories, setCategories] = useState<Category[]>([])

  const [section, setSection] = useState<'actualidad' | 'aprende'>('actualidad')
  const [contentType, setContentType] = useState('regulacion')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [readingTime, setReadingTime] = useState('')
  const [relatedCategoryId, setRelatedCategoryId] = useState('')
  const [featured, setFeatured] = useState(false)
  const [statusValue, setStatusValue] = useState<'draft' | 'published'>('draft')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
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
        setAuthStatus('unauthorized')
        return
      }
      setAuthStatus('ready')
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (authStatus !== 'ready') return
    let cancelled = false
    const load = async () => {
      const { data: cats } = await supabaseBanking.from('categories').select('id, name').order('name')
      if (!cancelled) setCategories((cats as Category[]) ?? [])

      if (articleId) {
        const { data } = await supabaseBanking
          .from('articles')
          .select(
            'section, content_type, title, slug, excerpt, body, author_name, reading_time_minutes, related_category_id, featured, status',
          )
          .eq('id', articleId)
          .maybeSingle()
        if (cancelled) return
        if (data) {
          setSection((data.section as 'actualidad' | 'aprende') ?? 'actualidad')
          setContentType(data.content_type ?? 'regulacion')
          setTitle(data.title ?? '')
          setSlug(data.slug ?? '')
          setExcerpt(data.excerpt ?? '')
          setBody(data.body ?? '')
          setAuthorName(data.author_name ?? '')
          setReadingTime(data.reading_time_minutes ? String(data.reading_time_minutes) : '')
          setRelatedCategoryId(data.related_category_id ?? '')
          setFeatured(Boolean(data.featured))
          setStatusValue((data.status as 'draft' | 'published') ?? 'draft')
        }
        setLoadingArticle(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authStatus, articleId])

  useEffect(() => {
    if (!slugManuallyEdited) setSlug(toSlug(title))
  }, [title, slugManuallyEdited])

  // Keep content_type valid whenever section changes (e.g. switching from
  // Actualidad to Aprende would otherwise leave an Actualidad-only type set).
  useEffect(() => {
    const valid = CONTENT_TYPES_BY_SECTION[section].map((t) => t.value)
    if (!valid.includes(contentType)) setContentType(valid[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  const handleSave = async (publish: boolean) => {
    setSaveError(null)
    const effectiveTitle = title.trim()
    const effectiveSlug = slug.trim() || toSlug(effectiveTitle)
    const effectiveBody = body.trim()

    if (!effectiveTitle) { setSaveError('El título es obligatorio.'); return }
    if (!effectiveSlug) { setSaveError('No se pudo generar un slug del título.'); return }
    if (!effectiveBody) { setSaveError('El contenido es obligatorio.'); return }

    const newStatus = publish ? 'published' : 'draft'
    const payload = {
      section,
      content_type: contentType,
      title: effectiveTitle,
      slug: effectiveSlug,
      excerpt: excerpt.trim() || null,
      body: effectiveBody,
      author_name: authorName.trim() || null,
      reading_time_minutes: readingTime.trim() ? Number(readingTime.trim()) : null,
      related_category_id: relatedCategoryId || null,
      featured,
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(publish && statusValue !== 'published' ? { published_at: new Date().toISOString() } : {}),
    }

    setSaving(true)
    try {
      if (isEdit && articleId) {
        const { error } = await supabaseBanking.from('articles').update(payload).eq('id', articleId)
        if (error) { setSaveError(`Error al guardar: ${error.message}`); return }
      } else {
        const { error } = await supabaseBanking
          .from('articles')
          .insert({ ...payload, published_at: publish ? new Date().toISOString() : null })
        if (error) { setSaveError(`Error al guardar: ${error.message}`); return }
      }
      router.push('/finiq/admin/articulos')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (authStatus === 'checking' || (isEdit && loadingArticle)) {
    return <div className="mx-auto max-w-2xl px-6 py-10 text-gray-500">Cargando…</div>
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">No tienes acceso a esta página.</p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100'

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/finiq/admin/articulos" className="mb-1 block text-sm font-medium text-gray-400 hover:text-gray-600">
        ← Artículos
      </Link>
      <h1 className="mb-8 text-xl font-semibold text-gray-900">{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</h1>

      <div className="space-y-5">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Sección</label>
            <select value={section} onChange={(e) => setSection(e.target.value as 'actualidad' | 'aprende')} className={inputClass}>
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={inputClass}>
              {CONTENT_TYPES_BY_SECTION[section].map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del artículo" className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
            placeholder="url-del-articulo"
            className={`${inputClass} font-mono`}
          />
          {slug ? <p className="mt-1 text-xs text-gray-400">finiq.ve/{section}/{slug}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Extracto</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Resumen breve (aparece en el índice)" className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Contenido
            {body ? <span className="ml-2 text-xs font-normal text-gray-400">{body.split(/\s+/).filter(Boolean).length} palabras</span> : null}
          </label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} placeholder="Contenido completo del artículo…" className={`${inputClass} resize-y leading-relaxed`} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Autor</label>
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Opcional" className={inputClass} />
          </div>
          <div className="w-40">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Min. de lectura</label>
            <input type="number" min="1" value={readingTime} onChange={(e) => setReadingTime(e.target.value)} placeholder="Opcional" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoría relacionada</label>
          <select value={relatedCategoryId} onChange={(e) => setRelatedCategoryId(e.target.value)} className={inputClass}>
            <option value="">Ninguna</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">Si eliges una, el artículo mostrará un botón "Comparar productos relacionados".</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Destacado
        </label>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        {saveError ? (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">Error al guardar</p>
            <p className="mt-0.5 font-mono text-xs text-red-600">{saveError}</p>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : statusValue === 'published' ? 'Guardar y mantener publicado' : 'Publicar'}
          </button>
          <Link href="/finiq/admin/articulos" className="ml-auto text-sm text-gray-400 transition hover:text-gray-600">
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  )
}
