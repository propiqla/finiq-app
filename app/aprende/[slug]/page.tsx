import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ArticleDetailClient from './ArticleDetailClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'banking' } })

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { data: article } = await supabaseBanking
    .from('articles')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('section', 'aprende')
    .maybeSingle()

  if (!article) {
    return { title: 'Artículo no encontrado | FinIQ.ve' }
  }

  const title = `${article.title} | FinIQ.ve`
  const description = article.excerpt ?? `${article.title} — guías y comparativas financieras para Venezuela en FinIQ.ve.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ArticleDetail({ params }: { params: Params }) {
  return <ArticleDetailClient params={params} />
}
