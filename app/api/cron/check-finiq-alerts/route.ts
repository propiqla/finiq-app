import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../../../lib/resend'

// Triggered daily by Vercel Cron (see vercel.json). Vercel automatically
// sends `Authorization: Bearer $CRON_SECRET` on cron-triggered requests
// when CRON_SECRET is set as an env var.
const CRON_SECRET = process.env.CRON_SECRET
const SITE_URL = 'https://finiq.propiqla.com'

type ExchangeSub = {
  id: string
  email: string
  rate_type: string
  base_currency: string
  threshold_pct: number
  last_notified_value: number | null
  unsubscribe_token: string
}

type FeeSub = {
  id: string
  email: string
  last_notified_snapshot: string | null
  unsubscribe_token: string
}

const RATE_TYPE_LABEL: Record<string, string> = {
  bcv_oficial: 'oficial BCV',
  paralelo_referencial: 'paralela (referencial)',
}

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'banking' } }
  )

  const results = { exchange_rate: { checked: 0, notified: 0 }, remittance_fee: { checked: 0, notified: 0 } }

  // --- Exchange rate alerts ---
  const { data: exchangeSubs } = await supabase
    .from('alert_subscriptions')
    .select('id, email, rate_type, base_currency, threshold_pct, last_notified_value, unsubscribe_token')
    .eq('alert_type', 'exchange_rate')
    .eq('confirmed', true)

  const subs = (exchangeSubs as ExchangeSub[]) ?? []
  results.exchange_rate.checked = subs.length

  const rateCache = new Map<string, number>()
  const rateKey = (rateType: string, currency: string) => `${rateType}:${currency}`

  for (const sub of subs) {
    const key = rateKey(sub.rate_type, sub.base_currency)
    let currentRate = rateCache.get(key)
    if (currentRate === undefined) {
      const { data: latest } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('rate_type', sub.rate_type)
        .eq('base_currency', sub.base_currency)
        .order('effective_date', { ascending: false })
        .order('scraped_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!latest) continue
      currentRate = Number(latest.rate)
      rateCache.set(key, currentRate)
    }

    if (sub.last_notified_value == null) {
      await supabase
        .from('alert_subscriptions')
        .update({ last_notified_value: currentRate, last_notified_at: new Date().toISOString() })
        .eq('id', sub.id)
      continue
    }

    const pctChange = ((currentRate - sub.last_notified_value) / sub.last_notified_value) * 100
    if (Math.abs(pctChange) < sub.threshold_pct) continue

    const label = RATE_TYPE_LABEL[sub.rate_type] ?? sub.rate_type
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${sub.unsubscribe_token}`
    const direction = pctChange > 0 ? 'subió' : 'bajó'

    const emailResult = await sendEmail({
      to: sub.email,
      subject: `La tasa ${label} ${direction} ${Math.abs(pctChange).toFixed(1)}%`,
      html: `
        <p>La tasa ${label} de ${sub.base_currency} ${direction} de Bs ${sub.last_notified_value.toLocaleString('es-VE')}
        a Bs ${currentRate.toLocaleString('es-VE')} (${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%).</p>
        <p><a href="${SITE_URL}/indicadores">Ver el detalle en FinIQ.ve →</a></p>
        <p style="color:#888;font-size:12px;"><a href="${unsubscribeUrl}">Cancelar esta alerta</a></p>
      `,
    })

    if (emailResult.ok) {
      results.exchange_rate.notified += 1
      await supabase
        .from('alert_subscriptions')
        .update({ last_notified_value: currentRate, last_notified_at: new Date().toISOString() })
        .eq('id', sub.id)
    } else {
      console.error(`FinIQ alert email failed for sub ${sub.id}:`, emailResult.error)
    }
  }

  // --- Remittance fee-change alerts (watch all Remesas products together) ---
  const { data: feeSubs } = await supabase
    .from('alert_subscriptions')
    .select('id, email, last_notified_snapshot, unsubscribe_token')
    .eq('alert_type', 'remittance_fee')
    .eq('confirmed', true)

  const fSubs = (feeSubs as FeeSub[]) ?? []
  results.remittance_fee.checked = fSubs.length

  if (fSubs.length > 0) {
    const { data: category } = await supabase.from('categories').select('id').eq('slug', 'remesas').maybeSingle()

    if (category) {
      const { data: products } = await supabase
        .from('products')
        .select('id, transfer_fee_note, min_transfer_usd, max_transfer_usd, avg_delivery_time')
        .eq('category_id', category.id)
        .eq('active', true)
        .order('id')

      const snapshot = JSON.stringify(
        (products ?? []).map((p) => [p.id, p.transfer_fee_note, p.min_transfer_usd, p.max_transfer_usd, p.avg_delivery_time])
      )

      for (const sub of fSubs) {
        if (sub.last_notified_snapshot == null) {
          await supabase
            .from('alert_subscriptions')
            .update({ last_notified_snapshot: snapshot, last_notified_at: new Date().toISOString() })
            .eq('id', sub.id)
          continue
        }

        if (sub.last_notified_snapshot === snapshot) continue

        const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${sub.unsubscribe_token}`
        const emailResult = await sendEmail({
          to: sub.email,
          subject: 'Hubo cambios en las opciones de remesas de FinIQ',
          html: `
            <p>Actualizamos comisiones, límites o tiempos de entrega en al menos un servicio de
            remesas verificado en FinIQ.ve.</p>
            <p><a href="${SITE_URL}/categorias/remesas">Ver los cambios →</a></p>
            <p style="color:#888;font-size:12px;"><a href="${unsubscribeUrl}">Cancelar esta alerta</a></p>
          `,
        })

        if (emailResult.ok) {
          results.remittance_fee.notified += 1
          await supabase
            .from('alert_subscriptions')
            .update({ last_notified_snapshot: snapshot, last_notified_at: new Date().toISOString() })
            .eq('id', sub.id)
        } else {
          console.error(`FinIQ fee alert email failed for sub ${sub.id}:`, emailResult.error)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, results })
}
