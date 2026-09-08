// Minimal Resend wrapper — plain fetch instead of the `resend` SDK to avoid
// adding a dependency for what's a single POST request. Server-only: reads
// RESEND_API_KEY from the environment, never exposed to the client.
//
// RESEND_API_KEY must be set in Vercel's project environment variables, and
// the sending domain (alerts.propiqla.com or similar) must be verified in
// the Resend dashboard before sends will succeed.

const RESEND_API_URL = 'https://api.resend.com/emails'

export const ALERTS_FROM = 'FinIQ Alertas <alertas@propiqla.com>'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY no está configurada' }
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: ALERTS_FROM, to: [to], subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `Resend ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
