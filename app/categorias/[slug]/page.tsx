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

export const revalidate = 300

export default async function CategoryDetail({ params }: { params: Params }) {
  const { slug } = await params
  const { data: category } = await supabaseBanking
    .from('categories')
    .select('id, name, description')
    .eq('slug', slug)
    .maybeSingle()

  let products: { name: string; summary: string | null; institutions: { name: string } | null }[] = []
  if (category) {
    const { data } = await supabaseBanking
      .from('products')
      .select('name, summary, institutions(name)')
      .eq('category_id', category.id)
      .eq('active', true)
      .order('name')
      .limit(40)
    products = (data ?? []) as unknown as typeof products
  }

  return (
    <>
      {category ? (
        <section className="mx-auto max-w-5xl px-6 pt-8">
          <h2 className="mb-2 text-base font-semibold text-gray-900">{category.name} en Venezuela</h2>
          <p className="text-sm leading-6 text-gray-600">
            {category.description ??
              `Compara ${category.name.toLowerCase()} entre bancos y fintechs en Venezuela, con datos verificados y su fuente.`}{' '}
            {products.length > 0
              ? `Hoy listamos ${products.length} producto${products.length === 1 ? '' : 's'} activo${products.length === 1 ? '' : 's'} en esta categoría: ${products
                  .slice(0, 12)
                  .map((p) => (p.institutions?.name ? `${p.name} (${p.institutions.name})` : p.name))
                  .join(', ')}${products.length > 12 ? ' y más' : ''}.`
              : ''}
          </p>
        </section>
      ) : null}
      <CategoryDetailClient params={params} />
    </>
  )
}
