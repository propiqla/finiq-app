'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Category-specific links (Cuentas de ahorro, Tarjetas de crédito, Préstamos,
// Remesas, Seguros, Inversiones) were removed 2026-08-07 — the CategoryMenu
// icon grid now on every page (below the exchange-rate ticker) covers that
// navigation, so keeping them here too was redundant.
const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Indicadores', href: '/indicadores' },
  { label: 'Actualidad', href: '/actualidad' },
  { label: 'Aprende', href: '/aprende' },
]

export default function FinIqNavBar() {
  const pathname = usePathname()
  const isEmpresas = pathname?.startsWith('/empresas')

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 text-2xl font-bold text-gray-900">
              FinIQ<span className="text-teal-700">.ve</span>
            </Link>

            <div className="flex items-center gap-1 rounded-full bg-teal-50 p-1 text-sm">
              <Link
                href="/"
                className={`rounded-full px-3 py-1 font-medium transition ${
                  !isEmpresas ? 'bg-teal-700 text-white' : 'text-gray-600 hover:text-teal-700'
                }`}
              >
                Personal
              </Link>
              <Link
                href="/empresas"
                className={`rounded-full px-3 py-1 font-medium transition ${
                  isEmpresas ? 'bg-teal-700 text-white' : 'text-gray-600 hover:text-teal-700'
                }`}
              >
                Empresas
              </Link>
            </div>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    pathname === link.href
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-teal-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Below lg the nav above is hidden entirely, so it's repeated here as a
            horizontally-scrollable row — otherwise links like Indicadores are
            unreachable on anything narrower than a large desktop window. */}
        <nav className="-mx-6 mt-3 flex items-center gap-1 overflow-x-auto px-6 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === link.href
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-teal-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
