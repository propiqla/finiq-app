'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Point = { effective_date: string; rate: number }

const formatShortDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })

export default function ExchangeRateTrendChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Todavía no tenemos suficientes días capturados para dibujar una tendencia — estamos
        guardando una foto real de la tasa cada día, así que el gráfico aparecerá en cuanto
        acumulemos más de un punto.
      </p>
    )
  }

  const data = points.map((p) => ({ date: formatShortDate(p.effective_date), rate: p.rate }))

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
            domain={['dataMin - 10', 'dataMax + 10']}
            tickFormatter={(v) => Number(v).toFixed(2)}
            width={64}
          />
          <Tooltip
            formatter={(value) => [`Bs ${Number(value).toFixed(2)}`, 'Tasa']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Line type="monotone" dataKey="rate" stroke="#0D9488" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
