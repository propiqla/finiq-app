import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseBanking } from '../../lib/supabase-banking'
import AdSlot from '../../components/AdSlot'

type Article = {
  title: string
  excerpt: string | null
  body: string | null
  content_type: string
  author_name: string | null
  reading_time_minutes: number | null
  related_category_id: string | null
  published_at: string | null
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  regulacion: 'Regulación',
  tendencia: 'Tendencia',
  producto: 'Producto nuevo',
  noticia: 'Noticia',
}

const dateFormatter = new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function ActualidadDetailClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: article, error } = await supabaseBanking
    .from('articles')
    .select('title, excerpt, body, content_type, author_name, reading_time_minutes, related_category_id, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('section', 'actualidad')
    .maybeSingle()

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pudimos cargar este artículo ({error.message}).
        </p>
      </div>
    )
  }
  if (!article) notFound()

  let relatedCategorySlug: string | null = null
  if (article.related_category_id) {
    const { data: cat } = await supabaseBanking
      .from('categories')
      .select('slug')
      .eq('id', article.related_category_id)
      .maybeSingle()
    relatedCategorySlug = cat?.slug ?? null
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {article ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: article.title,
              description: article.excerpt ?? undefined,
              datePublished: article.published_at ?? undefined,
              author: article.author_name ? { '@type': 'Person', name: article.author_name } : undefined,
              inLanguage: 'es-VE',
            }),
          }}
        />
      ) : null}
      <Link href="/actualidad" className="mb-4 inline-block text-xs font-medium text-gray-400 hover:text-teal-700">
        ← Actualidad
      </Link>
      <div>
        <span className="rounded-full bg-[#FDECD8] px-2.5 py-0.5 text-xs font-medium text-[#8A4B0A]">
          {CONTENT_TYPE_LABEL[article.content_type] ?? article.content_type}
        </span>
      </div>
      <h1 className="mb-2 mt-3 text-2xl font-semibold text-gray-900">{article.title}</h1>
      <p className="mb-8 text-sm text-gray-400">
        {[
          article.published_at ? dateFormatter.format(new Date(article.published_at)) : null,
          article.author_name,
          article.reading_time_minutes ? `${article.reading_time_minutes} min de lectura` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">
        {article.body}
      </div>

      {relatedCategorySlug ? (
        <Link
          href={`/categorias/${relatedCategorySlug}`}
          className="mt-8 inline-block rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Comparar productos relacionados →
        </Link>
      ) : null}

      <AdSlot placementSlug="aprende_article_bottom" className="mt-10" />
    </div>
  )
}
