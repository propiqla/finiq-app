import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Productos bancarios para empresas en Venezuela | FinIQ.ve',
  description:
    'Compara cuentas empresariales, tarjetas corporativas, financiamiento comercial y nómina de los bancos venezolanos.',
  alternates: { canonical: '/empresas' },
}

export default function EmpresasLayout({ children }: { children: React.ReactNode }) {
  return children
}
