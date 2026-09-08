const LABEL: Record<string, string> = {
  USD: 'USD',
  VES: 'Bs',
  USD_VES: 'USD y Bs',
}

const STYLE: Record<string, string> = {
  USD: 'bg-[#EAF3DE] text-[#3B6D11]', // green — dollar-denominated
  VES: 'bg-[#FAECE7] text-[#993C1D]', // coral — bolívar-denominated, flags inflation exposure
  USD_VES: 'bg-[#E6F1FB] text-[#185FA5]', // blue — both
}

// Always shown next to a rate/fee — in Venezuela, whether a number is in
// USD or Bs changes what it means far more than the number itself.
export default function CurrencyBadge({ currency }: { currency: string }) {
  const label = LABEL[currency] ?? currency
  const style = STYLE[currency] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${style}`}>{label}</span>
  )
}
