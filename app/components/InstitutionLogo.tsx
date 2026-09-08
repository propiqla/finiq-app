'use client'

import { useState } from 'react'
import { colorForInstitution, initialsFor } from '../lib/institutionColor'

function domainFromWebsite(website: string | null): string | null {
  if (!website) return null
  try {
    return new URL(website).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Tries a real logo opportunistically (only for institutions with a
// confirmed website on file), falling back to a colored initials badge —
// third-party logo CDNs like Clearbit are commonly stripped by ad
// blockers, and we don't have licensed rights to host banks' trademarked
// logos ourselves, so the badge is the real design, not just a fallback.
export default function InstitutionLogo({
  name,
  website,
  className = 'h-8 w-8',
}: {
  name: string
  website: string | null
  className?: string
}) {
  const domain = domainFromWebsite(website)
  const [failed, setFailed] = useState(false)
  const color = colorForInstitution(name)

  if (!domain || failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text} ${className}`}
      >
        {initialsFor(name)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logo.clearbit.com/${domain}?size=128`}
      alt={`${name} logo`}
      className={`rounded-full border border-gray-100 bg-white object-contain p-1 ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
