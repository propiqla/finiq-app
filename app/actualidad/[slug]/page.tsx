import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ActualidadDetailClient from './ActualidadDetailClient'

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
    .eq('section', 'actualidad')
    .eq('status', 'published')
    .maybeSingle()

  if (!article) {
    return { title: 'Artículo no encontrado | FinIQ.ve' }
  }

  const title = `${article.title} | FinIQ.ve`
  const description = article.excerpt ?? `${article.title} — actualidad financiera y regulatoria de Venezuela en FinIQ.ve.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ActualidadDetail({ params }: { params: Params }) {
  return <ActualidadDetailClient params={params} />
}
