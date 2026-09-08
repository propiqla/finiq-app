import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://finiq.propiqla.com'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/alertas?status=error`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'banking' } }
  )

  const { data, error } = await supabase
    .from('alert_subscriptions')
    .update({ confirmed: true })
    .eq('confirm_token', token)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    return NextResponse.redirect(`${SITE_URL}/alertas?status=error`)
  }

  return NextResponse.redirect(`${SITE_URL}/alertas?status=confirmed`)
}
