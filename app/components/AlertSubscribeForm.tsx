'use client'

import { useState, type FormEvent } from 'react'

type RateOption = { rate_type: string; base_currency: string; label: string }

type Props =
  | { mode: 'exchange_rate'; rateOptions: RateOption[] }
  | { mode: 'remittance_fee'; rateOptions?: undefined }

export default function AlertSubscribeForm(props: Props) {
  const [email, setEmail] = useState('')
  const [rateIndex, setRateIndex] = useState(0)
  const [threshold, setThreshold] = useState('2')
  const [state, setState] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const selectedRate = props.mode === 'exchange_rate' ? props.rateOptions[rateIndex] : null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return
    setState('submitting')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          props.mode === 'exchange_rate'
            ? {
                email,
                alert_type: 'exchange_rate',
                rate_type: selectedRate?.rate_type,
                base_currency: selectedRate?.base_currency,
                threshold_pct: Number(threshold) || 2,
              }
            : { email, alert_type: 'remittance_fee' }
        ),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Algo salió mal')
        setState('error')
        return
      }
      setState('sent')
    } catch {
      setErrorMsg('No pudimos conectar con el servidor')
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <p className="rounded-xl bg-[#F4FBF8] px-4 py-3 text-sm text-[#0D3B36]">
        Revisa tu correo (<span className="font-medium">{email}</span>) para confirmar la alerta.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      {props.mode === 'exchange_rate' ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Avísame cuando cambie</span>
          <select
            value={rateIndex}
            onChange={(e) => setRateIndex(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
          >
            {props.rateOptions.map((r, i) => (
              <option key={`${r.rate_type}-${r.base_currency}`} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {props.mode === 'exchange_rate' ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Umbral (%)</span>
          <input
            type="text"
            inputMode="decimal"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-16 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500">Tu correo</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="rounded-full bg-[#0D3B36] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a2e2a] disabled:opacity-50"
      >
        {state === 'submitting' ? 'Enviando…' : 'Crear alerta'}
      </button>

      {state === 'error' && errorMsg ? <p className="w-full text-xs text-red-600">{errorMsg}</p> : null}
    </form>
  )
}
