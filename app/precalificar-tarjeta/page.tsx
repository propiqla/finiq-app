import type { Metadata } from 'next'
import PrecalificarTarjetaClient from './PrecalificarTarjetaClient'

export const metadata: Metadata = {
  title: 'Precalifica para una tarjeta de crédito en Venezuela | FinIQ.ve',
  description:
    'Cuéntanos tu ingreso, antigüedad laboral y con qué bancos ya tienes cuenta — te mostramos qué tarjetas de crédito se ajustan mejor a tu perfil, en vivo mientras escribes.',
  openGraph: {
    title: 'Precalifica para una tarjeta de crédito | FinIQ.ve',
    description: 'Encuentra la tarjeta que mejor se ajusta a tu perfil — recomendación en vivo, no solo una tabla de tasas.',
    type: 'website',
  },
}

export default function PrecalificarTarjetaPage() {
  return <PrecalificarTarjetaClient />
}
