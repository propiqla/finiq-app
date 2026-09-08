'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { supabaseBanking } from '../../lib/supabase-banking'

type Placement = {
  id: string
  slug: string
  name: string
  description: string | null
  adsense_slot_id: string | null
}

export default function AdsAdmin() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'unauthorized' | 'ready'>('checking')

  const [clientId, setClientId] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data: agent } = await supabase
        .from('agents')
        .select('role')
        .eq('email', session.user.email ?? '')
        .maybeSingle()

      if (cancelled) return
      if (!agent || (agent as { role: string | null }).role !== 'admin') {
        setStatus('unauthorized')
        return
      }

      const [{ data: settings }, { data: placementRows }] = await Promise.all([
        supabaseBanking.from('ad_settings').select('adsense_client_id, adsense_enabled').eq('id', true).maybeSingle(),
        supabaseBanking
          .from('ad_placements')
          .select('id, slug, name, description, adsense_slot_id')
          .in('slug', ['indicadores_top', 'category_secondary', 'aprende_article_bottom'])
          .order('slug'),
      ])

      if (cancelled) return
      const s = settings as { adsense_client_id: string | null; adsense_enabled: boolean } | null
      setClientId(s?.adsense_client_id ?? '')
      setEnabled(s?.adsense_enabled ?? false)
      setPlacements((placementRows as Placement[]) ?? [])
      setStatus('ready')
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)

    const { error: settingsErr } = await supabaseBanking
      .from('ad_settings')
      .update({ adsense_client_id: clientId || null, adsense_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', true)

    let placementErr: string | null = null
    for (const p of placements) {
      const { error } = await supabaseBanking
        .from('ad_placements')
        .update({ adsense_slot_id: p.adsense_slot_id || null })
        .eq('id', p.id)
      if (error) placementErr = error.message
    }

    setSaving(false)
    if (settingsErr || placementErr) {
      setSaveMsg(`Error al guardar: ${settingsErr?.message ?? placementErr}`)
    } else {
      setSaveMsg('Guardado.')
    }
  }

  if (status === 'checking') {
    return <div className="mx-auto max-w-2xl px-6 py-10 text-gray-500">Verificando acceso…</div>
  }

  if (status === 'unauthorized') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No tienes acceso a esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Configuración de anuncios</h1>
      <p className="mb-8 text-sm text-gray-600">
        Cada espacio muestra primero un patrocinio vendido directamente (si hay uno activo para esa
        posición) y, si no, cae en el anuncio de AdSense configurado aquí. No requiere despliegue —
        los cambios se aplican de inmediato.
      </p>

      <div className="mb-8 rounded-2xl border border-gray-100 p-5">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Google AdSense</h2>
        <label className="mb-3 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Activar AdSense como respaldo
        </label>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Publisher / Client ID (ej. ca-pub-1234567890123456)
        </label>
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="ca-pub-..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
      </div>

      <div className="mb-8 space-y-4">
        <h2 className="text-sm font-medium text-gray-900">Espacios disponibles</h2>
        {placements.map((p) => (
          <div key={p.id} className="rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-900">{p.name}</p>
            {p.description ? <p className="mb-3 text-xs text-gray-500">{p.description}</p> : null}
            <label className="mb-1 block text-xs font-medium text-gray-500">Ad Slot ID de AdSense</label>
            <input
              type="text"
              value={p.adsense_slot_id ?? ''}
              onChange={(e) =>
                setPlacements((prev) =>
                  prev.map((x) => (x.id === p.id ? { ...x, adsense_slot_id: e.target.value } : x))
                )
              }
              placeholder="1234567890"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
      {saveMsg ? <p className="mt-3 text-sm text-gray-600">{saveMsg}</p> : null}
    </div>
  )
}
