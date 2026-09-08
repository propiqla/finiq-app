'use client'

// Decision-first homepage hero: leads with "what are you trying to do?"
// instead of "which bank should I use?" — the financial institution becomes
// the answer, not the starting point. Curated set of 8 goals (not every
// category — mortgages/vehicle loans/cards/savings/investing/remittances/
// insurance/business cover the vast majority of real intent), each mapped
// to an existing category or section page. Reuses CategoryGraphic + the
// category color system so it stays visually consistent with the rest of
// the site rather than introducing a second icon language.

import Link from 'next/link'
import CategoryGraphic from './CategoryGraphic'
import { getCategoryStyle } from '../lib/categoryPresentation'

type Intent = { slug: string; label: string; href: string }

const INTENTS: Intent[] = [
  { slug: 'prestamos-hipotecarios', label: 'Comprar una propiedad', href: '/financiar-propiedad' },
  { slug: 'financiamiento-comercial', label: 'Financiar mi empresa', href: '/empresas' },
  { slug: 'prestamos-vehiculo', label: 'Comprar un vehículo', href: '/categorias/prestamos-vehiculo' },
  { slug: 'tarjetas-credito', label: 'Conseguir una tarjeta', href: '/precalificar-tarjeta' },
  { slug: 'cuentas-ahorro', label: 'Abrir una cuenta en dólares', href: '/categorias/cuentas-ahorro' },
  { slug: 'inversiones', label: 'Invertir', href: '/categorias/inversiones' },
  { slug: 'remesas', label: 'Mover dinero internacionalmente', href: '/categorias/remesas' },
  { slug: 'seguros', label: 'Protegerme / asegurarme', href: '/categorias/seguros' },
]

export default function IntentGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {INTENTS.map((intent) => {
        const style = getCategoryStyle(intent.slug)
        return (
          <Link
            key={intent.label}
            href={intent.href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition group-hover:opacity-85 ${style.solid}`}
            >
              <CategoryGraphic slug={intent.slug} className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium leading-tight text-gray-900">{intent.label}</p>
          </Link>
        )
      })}
    </div>
  )
}
