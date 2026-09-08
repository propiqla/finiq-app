import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../../../lib/resend'

const SITE_URL = 'https://finiq.propiqla.com'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SubscribeBody = {
  email: string
  alert_type: 'exchange_rate' | 'remittance_fee'
  rate_type?: string
  base_currency?: string
  threshold_pct?: number
}

export async function POST(req: NextRequest) {
  let body: SubscribeBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
  }
  if (body.alert_type !== 'exchange_rate' && body.alert_type !== 'remittance_fee') {
    return NextResponse.json({ error: 'Tipo de alerta inválido' }, { status: 400 })
  }
  if (body.alert_type === 'exchange_rate' && (!body.rate_type || !body.base_currency)) {
    return NextResponse.json({ error: 'Falta rate_type o base_currency' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'banking' } }
  )

  const threshold_pct = body.alert_type === 'exchange_rate' ? Math.max(0.5, Number(body.threshold_pct) || 2) : 0

  const { data: inserted, error } = await supabase
    .from('alert_subscriptions')
    .insert({
      email,
      alert_type: body.alert_type,
      rate_type: body.alert_type === 'exchange_rate' ? body.rate_type : null,
      base_currency: body.alert_type === 'exchange_rate' ? body.base_currency : null,
      threshold_pct,
    })
    .select('id, confirm_token')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo crear la suscripción' }, { status: 500 })
  }

  const confirmUrl = `${SITE_URL}/api/alerts/confirm?token=${inserted.confirm_token}`

  const label =
    body.alert_type === 'exchange_rate'
      ? `la tasa ${body.rate_type === 'bcv_oficial' ? 'oficial BCV' : 'paralela'} (${body.base_currency})`
      : 'las tarifas de remesas'

  const emailResult = await sendEmail({
    to: email,
    subject: 'Confirma tu alerta de FinIQ',
    html: `
      <p>Hola,</p>
      <p>Recibimos una solicitud para avisarte por correo cuando ${label} cambie de forma
      significativa en <a href="${SITE_URL}">FinIQ.ve</a>.</p>
      <p><a href="${confirmUrl}" style="display:inline-block;background:#0D3B36;color:#fff;
      padding:10px 20px;border-radius:8px;text-decoration:none;">Confirmar suscripción</a></p>
      <p>Si no fuiste tú, ignora este correo — no se activará ninguna alerta sin confirmar.</p>
    `,
  })

  if (!emailResult.ok) {
    console.error('FinIQ alert confirmation email failed:', emailResult.error)
    return NextResponse.json(
      { ok: true, warning: 'No pudimos enviar el correo de confirmación. Intenta de nuevo más tarde.' },
      { status: 200 }
    )
  }

  return NextResponse.json({ ok: true })
}
