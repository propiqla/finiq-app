// Deterministic flat color per institution — same institution always lands
// on the same color across the ticker, profile pages, etc. Reuses the
// site's established ramp colors (see categoryPresentation.ts).

export type InstitutionColor = { bg: string; text: string }

const PALETTE: InstitutionColor[] = [
  { bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]' }, // green
  { bg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]' }, // blue
  { bg: 'bg-[#FAEEDA]', text: 'text-[#854F0B]' }, // amber
  { bg: 'bg-[#FAECE7]', text: 'text-[#993C1D]' }, // coral
  { bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]' }, // purple
  { bg: 'bg-[#FBEAF0]', text: 'text-[#993556]' }, // pink
]

export function colorForInstitution(name: string): InstitutionColor {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function initialsFor(name: string): string {
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  const first = words[0]?.charAt(0) ?? ''
  const second = words.length > 1 ? words[1].charAt(0) : ''
  return (first + second).toUpperCase()
}
