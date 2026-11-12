import type { Metadata } from 'next'
import { supabaseBanking } from '../lib/supabase-banking'

export const revalidate = 900

export const metadata: Metadata = {
  title: 'Dólar BCV hoy y dólar paralelo en Venezuela: tasas y brecha | FinIQ.ve',
  description:
    'Tasa oficial del BCV (USD y EUR) comparada con el dólar paralelo en Venezuela, con fecha y fuente de cada dato e historial diario.',
  alternates: { canonical: '/indicadores' },
}

type Row = { rate_type: string; base_currency: string; rate: number | string; effective_date: string }

const fmt = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })

async function latest(rateType: string, base: string): Promise<Row | null> {
  const { data } = await supabaseBanking
    .from('exchange_rates')
    .select('rate_type, base_currency, rate, effective_date')
    .eq('rate_type', rateType)
    .eq('base_currency', base)
    .order('effective_date', { ascending: false })
    .limit(1)
  return (data?.[0] as Row | undefined) ?? null
}

export default async function IndicadoresLayout({ children }: { children: React.ReactNode }) {
  const [usd, eur, par] = await Promise.all([
    latest('bcv_oficial', 'USD'),
    latest('bcv_oficial', 'EUR'),
    latest('paralelo_referencial', 'USD'),
  ])
  const usdN = usd ? Number(usd.rate) : null
  const parN = par ? Number(par.rate) : null
  const gap = usdN && parN ? ((parN - usdN) / usdN) * 100 : null

  return (
    <>
      {usd ? (
        <section className="mx-auto max-w-5xl px-6 pt-8">
          <h2 className="mb-2 text-base font-semibold text-gray-900">Tasas más recientes</h2>
          <p className="text-sm leading-6 text-gray-600">
            La tasa oficial del Banco Central de Venezuela (BCV) para el dólar es{' '}
            <strong>{fmt(usdN!)} Bs/USD</strong> (valor al {fmtDate(usd.effective_date)})
            {eur ? (
              <>
                {' '}y la del euro <strong>{fmt(Number(eur.rate))} Bs/EUR</strong>
              </>
            ) : null}
            .
            {par && gap !== null ? (
              <>
                {' '}El dólar paralelo de referencia (agregado de mercado, {fmtDate(par.effective_date)}) cotiza en{' '}
                <strong>{fmt(parN!)} Bs/USD</strong>, una brecha de {fmt(gap)}% frente a la tasa oficial.
              </>
            ) : null}{' '}
            Los valores del BCV se publican en días hábiles; los fines de semana y feriados no tienen tasa nueva.
            Abajo puedes ver el historial, la brecha entre ambas tasas y crear una alerta por correo.
          </p>
        </section>
      ) : null}
      {children}
    </>
  )
}
