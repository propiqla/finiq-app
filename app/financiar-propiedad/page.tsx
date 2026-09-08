import type { Metadata } from 'next'
import FinanciarPropiedadClient from './FinanciarPropiedadClient'

export const metadata: Metadata = {
  title: 'Financiar una propiedad — créditos hipotecarios en Venezuela | FinIQ.ve',
  description:
    'Dinos el valor de la propiedad y tu pago inicial: te mostramos qué créditos hipotecarios se ajustan mejor, con tasa, condiciones, fuente y fecha de verificación de cada uno.',
  openGraph: {
    title: 'Financiar una propiedad en Venezuela | FinIQ.ve',
    description: 'Encuentra el crédito hipotecario que mejor se ajusta a tu financiamiento — comparación con recomendación, no solo una tabla de tasas.',
    type: 'website',
  },
}

export default function FinanciarPropiedadPage() {
  return <FinanciarPropiedadClient />
}
