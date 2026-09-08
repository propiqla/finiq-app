'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBanking } from '../lib/supabase-banking'

// A slot that's either sold directly (a "Patrocinado" native placement, same
// disclosure pattern as the category comparison tables) or, when nothing is
// booked, falls back to a Google AdSense unit — configurable from
// /finiq/admin/ads, no code changes or deploys needed to turn it on or swap
// the client/slot IDs.

type SponsoredRow = { sponsorship_id: string; institution_id: string; disclosure_label: string }
type Institution = { slug: string; name: string }

export default function AdSlot({
  placementSlug,
  categoryId,
  className = '',
}: {
  placementSlug: string
  categoryId?: string | null
  className?: string
}) {
  const [sponsor, setSponsor] = useState<{ institution: Institution; disclosureLabel: string } | null>(null)
  const [adsense, setAdsense] = useState<{ clientId: string; slotId: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      let sponsoredQuery = supabaseBanking
        .from('sponsored_placements')
        .select('sponsorship_id, institution_id, disclosure_label')
        .eq('placement_slug', placementSlug)
      sponsoredQuery = categoryId ? sponsoredQuery.eq('category_id', categoryId) : sponsoredQuery.is('category_id', null)

      const { data: sponsoredRows } = await sponsoredQuery.limit(1)
      const sponsoredRow = (sponsoredRows as SponsoredRow[] | null)?.[0]

      if (sponsoredRow) {
        const { data: inst } = await supabaseBanking
          .from('institutions')
          .select('slug, name')
          .eq('id', sponsoredRow.institution_id)
          .maybeSingle()
        if (!cancelled && inst) {
          setSponsor({ institution: inst as Institution, disclosureLabel: sponsoredRow.disclosure_label })
          setReady(true)
          return
        }
      }

      const [{ data: settings }, { data: placement }] = await Promise.all([
        supabaseBanking.from('ad_settings').select('adsense_client_id, adsense_enabled').eq('id', true).maybeSingle(),
        supabaseBanking.from('ad_placements').select('adsense_slot_id').eq('slug', placementSlug).maybeSingle(),
      ])

      if (!cancelled) {
        const clientId = (settings as { adsense_client_id: string | null; adsense_enabled: boolean } | null)?.adsense_client_id
        const enabled = (settings as { adsense_client_id: string | null; adsense_enabled: boolean } | null)?.adsense_enabled
        const slotId = (placement as { adsense_slot_id: string | null } | null)?.adsense_slot_id
        if (enabled && clientId && slotId) {
          setAdsense({ clientId, slotId })
        }
        setReady(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [placementSlug, categoryId])

  useEffect(() => {
    if (!adsense) return
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      // AdSense script not ready yet — safe to ignore, nothing renders in the slot.
    }
  }, [adsense])

  if (!ready) return null

  if (sponsor) {
    return (
      <Link
        href={`/finiq/bancos/${sponsor.institution.slug}`}
        className={`block rounded-2xl border border-gray-100 bg-[#FDF6EA] px-5 py-4 transition hover:border-gray-200 ${className}`}
      >
        <span className="rounded-full bg-[#FAEEDA] px-2 py-0.5 text-[10px] font-medium text-[#854F0B]">
          {sponsor.disclosureLabel}
        </span>
        <p className="mt-2 text-sm font-medium text-gray-900">{sponsor.institution.name}</p>
      </Link>
    )
  }

  if (adsense) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-gray-100 p-2 ${className}`}>
        {/* Loader script is now injected site-wide from the root layout
            (needed for AdSense's own site verification), so only the ad
            unit itself needs to render here. */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsense.clientId}
          data-ad-slot={adsense.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  // Nothing booked and AdSense isn't configured yet — show a house placeholder
  // so the slot is visibly reserved (and sellable) instead of rendering blank.
  return (
    <a
      href="mailto:argiancola@gmail.com?subject=Anunciarme%20en%20FinIQ.ve"
      className={`flex items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-gray-400 transition hover:border-gray-300 hover:text-gray-500 ${className}`}
    >
      <span className="text-xs">Espacio publicitario disponible</span>
      <span className="text-xs font-medium">Anúnciate aquí →</span>
    </a>
  )
}
