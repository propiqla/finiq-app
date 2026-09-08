'use client'

import { useEffect, useState } from 'react'
import { supabaseBanking } from '../lib/supabase-banking'

type OriginCountry = { country_code: string; country_name: string }

const formatBs = (n: number) =>
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Inputs only — the filtered results live in the single product table below
// instead of a separate list here, so amount/origin are controlled by the
// parent and applied directly to that table.
export default function RemittanceCalculator({
  availableCountries,
  amount,
  onAmountChange,
  origin,
  onOriginChange,
}: {
  availableCountries: OriginCountry[]
  amount: string
  onAmountChange: (value: string) => void
  origin: string | null
  onOriginChange: (value: string | null) => void
}) {
  const [paraleloRate, setParaleloRate] = useState<{ rate: number; effective_date: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data } = await supabaseBanking
        .from('exchange_rates')
        .select('rate, effective_date')
        .eq('rate_type', 'paralelo_referencial')
        .eq('base_currency', 'USD')
        .order('effective_date', { ascending: false })
        .order('scraped_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled && data) {
        setParaleloRate(data as { rate: number; effective_date: string })
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const numericAmount = Number(amount.replace(',', '.'))
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const bsEquivalent = validAmount && paraleloRate ? numericAmount * paraleloRate.rate : null

  return (
    <div className="mb-6 rounded-2xl border border-teal-100 bg-[#F4FBF8] p-5">
      <h2 className="mb-1 text-base font-semibold text-gray-900">Calculadora de remesas</h2>
      <p className="mb-4 text-xs text-gray-500">
        Ingresa un monto y el país de origen para filtrar la tabla de abajo con los servicios que lo
        aceptan, y estimar cuánto recibiría tu destinatario en bolívares.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Monto a enviar (USD)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Enviar desde</span>
          <select
            value={origin ?? ''}
            onChange={(e) => onOriginChange(e.target.value || null)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
          >
            <option value="">Todos los países</option>
            {availableCountries.map((c) => (
              <option key={c.country_code} value={c.country_code}>
                {c.country_name}
              </option>
            ))}
          </select>
        </label>

        {bsEquivalent != null ? (
          <div className="text-sm text-gray-700">
            ≈ <span className="font-semibold text-teal-800">Bs {formatBs(bsEquivalent)}</span>
            {paraleloRate ? (
              <span className="ml-1 text-xs text-gray-400">(tasa paralela {paraleloRate.effective_date})</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-[11px] text-gray-400">
        Estimado a la tasa paralela referencial de hoy. Las comisiones reales varían según monto, forma
        de pago y promociones — confirma el costo final directamente con cada proveedor antes de enviar.
      </p>
    </div>
  )
}
