import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://finiq.propiqla.com'

const supabaseBanking = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { db: { schema: 'banking' } },
)

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/categorias`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/empresas`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/aprende`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/actualidad`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/indicadores`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/financiar-propiedad`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/precalificar-tarjeta`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/alertas`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const [{ data: categories }, { data: institutions }, { data: articles }] = await Promise.all([
    supabaseBanking.from('categories').select('slug'),
    supabaseBanking.from('institutions').select('slug'),
    supabaseBanking
      .from('articles')
      .select('slug, section, updated_at')
      .eq('status', 'published'),
  ])

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((c: { slug: string }) => ({
    url: `${BASE_URL}/categorias/${c.slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const institutionUrls: MetadataRoute.Sitemap = (institutions ?? []).map((i: { slug: string }) => ({
    url: `${BASE_URL}/bancos/${i.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const articleUrls: MetadataRoute.Sitemap = (
    (articles ?? []) as { slug: string; section: string; updated_at: string | null }[]
  ).map((a) => ({
    url: `${BASE_URL}/${a.section === 'actualidad' ? 'actualidad' : 'aprende'}/${a.slug}`,
    lastModified: a.updated_at ?? undefined,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticPages, ...categoryUrls, ...institutionUrls, ...articleUrls]
}
