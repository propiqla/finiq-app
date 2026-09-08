// Which columns make sense depends heavily on the category: a loan's
// "Apertura mínima" and "Pago Móvil" are meaningless, while a savings
// account has no "Plazo" or "Monto del préstamo". This maps each category
// slug to the column set that's actually relevant to it.

import type { ReactNode } from 'react'

export type ProductForColumns = {
  currency?: string
  interest_rate: number | null
  monthly_fee_usd: number | null
  min_opening_balance_usd: number | null
  loan_term_min_months: number | null
  loan_term_max_months: number | null
  loan_amount_min_usd: number | null
  loan_amount_max_usd: number | null
  annual_fee_usd: number | null
  credit_limit_min_usd: number | null
  credit_limit_max_usd: number | null
  min_transfer_usd: number | null
  max_transfer_usd: number | null
  transfer_fee_note: string | null
  delivery_methods: string[] | null
  avg_delivery_time: string | null
  originCountries?: { country_code: string; country_name: string }[]
  institutions: { supports_pago_movil: boolean } | null
  policy_type: string | null
  coverage_summary: string | null
  premium_usd_min: number | null
  premium_period: string | null
  investment_type: string | null
  min_investment_usd: number | null
  min_investment_ves: number | null
  return_rate_min: number | null
  return_rate_max: number | null
  return_note: string | null
  card_network: string | null
  international_use: boolean | null
  contactless: boolean | null
  description: string | null
  opening_fee_usd: number | null
  reload_limit_usd: number | null
  reload_limit_period: string | null
}

export type ColumnDef = {
  key: string
  header: string
  render: (p: ProductForColumns) => ReactNode
}

const usd = (n: number) => `$${n.toLocaleString('es-VE')}`

const usdRange = (min: number | null, max: number | null) => {
  if (min == null && max == null) return '—'
  if (min != null && max != null) return min === max ? usd(min) : `${usd(min)} – ${usd(max)}`
  if (min != null) return `Desde ${usd(min)}`
  return `Hasta ${usd(max as number)}`
}

const monthsRange = (min: number | null, max: number | null) => {
  if (min == null && max == null) return '—'
  if (min != null && max != null) return min === max ? `${min} meses` : `${min}–${max} meses`
  if (min != null) return `Desde ${min} meses`
  return `Hasta ${max} meses`
}

const rateCol: ColumnDef = {
  key: 'rate',
  header: 'Tasa',
  render: (p) => (p.interest_rate != null ? `${p.interest_rate}%` : '—'),
}

const LOAN_COLUMNS: ColumnDef[] = [
  rateCol,
  { key: 'term', header: 'Plazo', render: (p) => monthsRange(p.loan_term_min_months, p.loan_term_max_months) },
  { key: 'amount', header: 'Monto', render: (p) => usdRange(p.loan_amount_min_usd, p.loan_amount_max_usd) },
]

const CARD_COLUMNS: ColumnDef[] = [
  rateCol,
  {
    key: 'annual_fee',
    header: 'Anualidad',
    render: (p) => (p.annual_fee_usd != null ? (p.annual_fee_usd === 0 ? 'Sin anualidad' : `${usd(p.annual_fee_usd)}/año`) : '—'),
  },
  { key: 'limit', header: 'Límite de crédito', render: (p) => usdRange(p.credit_limit_min_usd, p.credit_limit_max_usd) },
]

const ACCOUNT_COLUMNS: ColumnDef[] = [
  rateCol,
  { key: 'fee', header: 'Mantenimiento', render: (p) => (p.monthly_fee_usd != null ? usd(p.monthly_fee_usd) : '—') },
  { key: 'min_opening', header: 'Apertura mín.', render: (p) => (p.min_opening_balance_usd != null ? usd(p.min_opening_balance_usd) : '—') },
  {
    key: 'pago_movil',
    header: 'Pago Móvil',
    // Pago Móvil moves bolívares only — showing a check for a USD-denominated
    // account would imply something the product can't actually do.
    render: (p) => (p.institutions?.supports_pago_movil && p.currency !== 'USD' ? '✓' : '—'),
  },
]

const DEFAULT_COLUMNS: ColumnDef[] = [
  rateCol,
  { key: 'fee', header: 'Mantenimiento', render: (p) => (p.monthly_fee_usd != null ? usd(p.monthly_fee_usd) : '—') },
]

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s)

const DELIVERY_METHOD_LABEL: Record<string, string> = {
  cash_pickup: 'Efectivo',
  bank_deposit: 'Cuenta bancaria',
  pago_movil: 'Pago Móvil',
  mobile_wallet: 'Billetera móvil',
}

const COUNTRY_FLAG: Record<string, string> = {
  US: '🇺🇸',
  CO: '🇨🇴',
  ES: '🇪🇸',
}

const REMESAS_COLUMNS: ColumnDef[] = [
  {
    key: 'origin',
    header: 'Disponible desde',
    render: (p) =>
      p.originCountries && p.originCountries.length > 0
        ? p.originCountries
            .map((c) => `${COUNTRY_FLAG[c.country_code] ?? ''} ${c.country_name}`.trim())
            .join(' · ')
        : '—',
  },
  {
    key: 'transfer_range',
    header: 'Envío mín. – máx.',
    render: (p) => usdRange(p.min_transfer_usd, p.max_transfer_usd),
  },
  {
    key: 'fee_note',
    header: 'Comisión',
    render: (p) => (p.transfer_fee_note ? truncate(p.transfer_fee_note, 90) : '—'),
  },
  {
    key: 'delivery',
    header: 'Entrega',
    render: (p) => {
      const methods = p.delivery_methods?.map((m) => DELIVERY_METHOD_LABEL[m] ?? m).join(', ')
      if (!methods && !p.avg_delivery_time) return '—'
      return [methods, p.avg_delivery_time].filter(Boolean).join(' — ')
    },
  },
]

export const POLICY_TYPE_LABEL: Record<string, string> = {
  auto: 'Auto',
  salud: 'Salud',
  vida: 'Vida',
  hogar: 'Hogar',
}

const SEGUROS_COLUMNS: ColumnDef[] = [
  { key: 'policy_type', header: 'Tipo', render: (p) => (p.policy_type ? POLICY_TYPE_LABEL[p.policy_type] ?? p.policy_type : '—') },
  {
    key: 'premium',
    header: 'Desde',
    render: (p) =>
      p.premium_usd_min != null
        ? `$${p.premium_usd_min.toLocaleString('es-VE')}${p.premium_period === 'mensual' ? '/mes' : p.premium_period === 'anual' ? '/año' : ''}`
        : 'Cotización personalizada',
  },
  { key: 'coverage', header: 'Cobertura', render: (p) => (p.coverage_summary ? truncate(p.coverage_summary, 90) : '—') },
]

const INVERSIONES_TYPE_LABEL: Record<string, string> = {
  fondo_mutual: 'Fondo mutual',
  deposito_plazo: 'Depósito a plazo',
  mesa_dinero: 'Mesa de dinero',
  corretaje: 'Corretaje / Bolsa',
}

const INVERSIONES_COLUMNS: ColumnDef[] = [
  { key: 'type', header: 'Tipo', render: (p) => (p.investment_type ? INVERSIONES_TYPE_LABEL[p.investment_type] ?? p.investment_type : '—') },
  {
    key: 'min_investment',
    header: 'Inversión mínima',
    render: (p) => {
      if (p.min_investment_usd != null) return usd(p.min_investment_usd)
      if (p.min_investment_ves != null) return `Bs ${p.min_investment_ves.toLocaleString('es-VE')}`
      return '—'
    },
  },
  {
    key: 'return',
    header: 'Rendimiento',
    render: (p) => {
      if (p.return_rate_min != null && p.return_rate_max != null) {
        return `${p.return_rate_min}%–${p.return_rate_max}%`
      }
      return p.return_note ? truncate(p.return_note, 70) : '—'
    },
  },
]

const PREPAGO_COLUMNS: ColumnDef[] = [
  { key: 'network', header: 'Red', render: (p) => p.card_network ?? '—' },
  { key: 'issuance_fee', header: 'Costo de emisión', render: (p) => (p.opening_fee_usd != null ? (p.opening_fee_usd === 0 ? 'Gratis' : usd(p.opening_fee_usd)) : 'No publicado') },
  {
    key: 'reload_limit',
    header: 'Límite de recarga',
    render: (p) => {
      if (p.reload_limit_usd == null) return 'No publicado'
      const period = p.reload_limit_period && p.reload_limit_period !== 'no especificado (posible tope mensual)' ? `/${p.reload_limit_period}` : ''
      return `${usd(p.reload_limit_usd)}${period}`
    },
  },
]

const DEBIT_COLUMNS: ColumnDef[] = [
  { key: 'network', header: 'Red', render: (p) => p.card_network ?? '—' },
  {
    key: 'international',
    header: 'Uso internacional',
    render: (p) => (p.international_use === true ? '✓' : p.international_use === false ? '✕' : 'No confirmado'),
  },
  { key: 'contactless', header: 'Contactless', render: (p) => (p.contactless === true ? '✓' : p.contactless === false ? '✕' : '—') },
]

const LOAN_CATEGORY_SLUGS = new Set([
  'prestamos-personales',
  'prestamos-vehiculo',
  'prestamos-hipotecarios',
  'financiamiento-comercial',
])

export const CARD_CATEGORY_SLUGS = new Set(['tarjetas-credito', 'tarjetas-corporativas'])

const ACCOUNT_CATEGORY_SLUGS = new Set(['cuentas-ahorro', 'cuentas-corriente', 'cuentas-empresariales'])

// Nómina y Pagos / Comercio Exterior are services, not priced products —
// showing "Tasa"/"Mantenimiento" columns full of dashes would be misleading.
// Show the description instead, since that's where the actual substance is.
const SERVICE_CATEGORY_SLUGS = new Set(['nomina-pagos', 'comercio-exterior'])

const SERVICE_COLUMNS: ColumnDef[] = [
  { key: 'description', header: 'Servicio', render: (p) => (p.description ? truncate(p.description, 140) : '—') },
]

export function getColumnsForCategory(slug: string): ColumnDef[] {
  if (slug === 'remesas') return REMESAS_COLUMNS
  if (slug === 'seguros') return SEGUROS_COLUMNS
  if (slug === 'inversiones') return INVERSIONES_COLUMNS
  if (slug === 'tarjetas-debito') return DEBIT_COLUMNS
  if (slug === 'tarjetas-prepago') return PREPAGO_COLUMNS
  if (SERVICE_CATEGORY_SLUGS.has(slug)) return SERVICE_COLUMNS
  if (LOAN_CATEGORY_SLUGS.has(slug)) return LOAN_COLUMNS
  if (CARD_CATEGORY_SLUGS.has(slug)) return CARD_COLUMNS
  if (ACCOUNT_CATEGORY_SLUGS.has(slug)) return ACCOUNT_COLUMNS
  return DEFAULT_COLUMNS
}
