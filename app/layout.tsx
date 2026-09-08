import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { createClient } from '@supabase/supabase-js'
import './globals.css'
import FinIqNavBar from './components/FinIqNavBar'
import InstitutionTicker from './components/InstitutionTicker'
import ExchangeRateTicker from './components/ExchangeRateTicker'
import CategoryMenu from './components/CategoryMenu'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FinIQ Venezuela — Comparador financiero',
  description:
    'Compara bancos, tarjetas, préstamos y billeteras digitales en Venezuela — gratis, claro y sin registro.',
}

// AdSense's "AdSense code snippet" site verification wants this loader present
// in <head> on every page of the domain, so it lives in the root layout rather
// than only inside AdSlot.tsx. Reads from banking.ad_settings (same config as
// /admin/ads) so turning AdSense on/off or changing the client ID never needs
// a redeploy. Carried over from propiqla-app's root layout, unchanged, since
// FinIQ now owns this domain directly.
async function getAdsenseClientId(): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'banking' } })
    const { data } = await supabaseBanking
      .from('ad_settings')
      .select('adsense_client_id, adsense_enabled')
      .eq('id', true)
      .maybeSingle()
    const settings = data as { adsense_client_id: string | null; adsense_enabled: boolean } | null
    return settings?.adsense_enabled && settings.adsense_client_id ? settings.adsense_client_id : null
  } catch {
    return null
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const adsenseClientId = await getAdsenseClientId()

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      {adsenseClientId ? (
        <head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        </head>
      ) : null}
      <body className="min-h-full flex flex-col bg-white">
        <FinIqNavBar />
        <ExchangeRateTicker />
        <CategoryMenu />
        <main className="flex-1">{children}</main>
        <InstitutionTicker />
        <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
          <a href="/privacy" className="hover:text-gray-600 hover:underline">
            Política de privacidad
          </a>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} FinIQ Venezuela</span>
        </footer>
      </body>
    </html>
  )
}
