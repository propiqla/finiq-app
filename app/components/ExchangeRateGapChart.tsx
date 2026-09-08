'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

type GapPoint = {
  effective_date: string
  bcv_date: string
  gap_pct: number
  gap_bs: number
}

const formatShortDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })

export default function ExchangeRateGapChart({ points }: { points: GapPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Todavía no tenemos suficientes días capturados para dibujar la brecha cambiaria — aparecerá
        en cuanto acumulemos más de un punto en ambas tasas.
      </p>
    )
  }

  const data = points.map((p) => ({
    date: formatShortDate(p.effective_date),
    gapPct: Number(p.gap_pct.toFixed(2)),
    gapBs: Number(p.gap_bs.toFixed(2)),
    bcvDate: formatShortDate(p.bcv_date),
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            domain={['dataMin - 2', 'dataMax + 2']}
            tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
            width={44}
          />
          <ReferenceLine y={0} stroke="#E5E7EB" />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'gapPct') return [`${Number(value).toFixed(1)}%`, 'Brecha']
              return [value, name]
            }}
            labelFormatter={(label, payload) => {
              const bcvDate = payload?.[0]?.payload?.bcvDate
              const gapBs = payload?.[0]?.payload?.gapBs
              return bcvDate
                ? `${label} (vs. oficial del ${bcvDate}, +Bs ${gapBs})`
                : label
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Line type="monotone" dataKey="gapPct" stroke="#B45309" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
