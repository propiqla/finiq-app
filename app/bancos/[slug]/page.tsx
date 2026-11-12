import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import BankProfileClient from './BankProfileClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'banking' } })

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { data: institution } = await supabaseBanking
    .from('institutions')
    .select('name, description')
    .eq('slug', slug)
    .maybeSingle()

  if (!institution) {
    return { title: 'Institución no encontrada | FinIQ.ve' }
  }

  const title = `${institution.name} — tasas y productos | FinIQ.ve`
  const description =
    institution.description ??
    `Compara las tasas, tarjetas y productos de ${institution.name} en Venezuela, con datos verificados y su fuente.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export const revalidate = 300

export default async function BankProfile({ params }: { params: Params }) {
  const { slug } = await params
  const { data: institution } = await supabaseBanking
    .from('institutions')
    .select('id, name, description')
    .eq('slug', slug)
    .maybeSingle()

  let products: { name: string }[] = []
  if (institution) {
    const { data } = await supabaseBanking
      .from('products')
      .select('name')
      .eq('institution_id', institution.id)
      .eq('active', true)
      .order('name')
      .limit(60)
    products = data ?? []
  }

  return (
    <>
      {institution ? (
        <section className="mx-auto max-w-5xl px-6 pt-8">
          <h2 className="mb-2 text-base font-semibold text-gray-900">{institution.name}: tasas y productos</h2>
          <p className="text-sm leading-6 text-gray-600">
            {institution.description ??
              `Compara las tasas, tarjetas y productos de ${institution.name} en Venezuela, con datos verificados y su fuente.`}{' '}
            {products.length > 0
              ? `Productos que listamos hoy: ${products.map((p) => p.name).join(', ')}.`
              : ''}
          </p>
        </section>
      ) : null}
      <BankProfileClient params={params} />
    </>
  )
}
