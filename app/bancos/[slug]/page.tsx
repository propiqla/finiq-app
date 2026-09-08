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

export default async function BankProfile({ params }: { params: Params }) {
  return <BankProfileClient params={params} />
}
