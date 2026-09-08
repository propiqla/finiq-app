import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import CategoryDetailClient from './CategoryDetailClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'banking' } })

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { data: category } = await supabaseBanking
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .maybeSingle()

  if (!category) {
    return { title: 'Categoría no encontrada | FinIQ.ve' }
  }

  const title = `${category.name} — comparar en Venezuela | FinIQ.ve`
  const description =
    category.description ??
    `Compara tasas, montos y condiciones de ${category.name.toLowerCase()} entre bancos y fintechs en Venezuela, con datos verificados y su fuente.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function CategoryDetail({ params }: { params: Params }) {
  return <CategoryDetailClient params={params} />
}
