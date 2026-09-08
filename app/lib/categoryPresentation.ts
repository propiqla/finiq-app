// Shared per-category visual treatment (badge background, icon background,
// accent text color) so the homepage, categorias index, and empresas page
// all render category cards consistently. Colors are grouped by concept
// family rather than assigned uniquely per category — e.g. all three loan
// types share the coral family, distinguished by icon shape instead.

export type CategoryStyle = { bg: string; iconBg: string; text: string; solid: string }

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'cuentas-ahorro': { bg: 'bg-[#F4FBF8]', iconBg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', solid: 'bg-[#3B6D11]' },
  'cuentas-corriente': { bg: 'bg-[#F4FBF8]', iconBg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', solid: 'bg-[#3B6D11]' },
  'billeteras-digitales': { bg: 'bg-[#EEF6FC]', iconBg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', solid: 'bg-[#185FA5]' },
  'tarjetas-debito': { bg: 'bg-[#EEF6FC]', iconBg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', solid: 'bg-[#185FA5]' },
  'tarjetas-credito': { bg: 'bg-[#FDF6EA]', iconBg: 'bg-[#FAEEDA]', text: 'text-[#854F0B]', solid: 'bg-[#B4790A]' },
  'tarjetas-prepago': { bg: 'bg-[#EEF6FC]', iconBg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', solid: 'bg-[#185FA5]' },
  'prestamos-personales': { bg: 'bg-[#FBF2EE]', iconBg: 'bg-[#FAECE7]', text: 'text-[#993C1D]', solid: 'bg-[#993C1D]' },
  'prestamos-vehiculo': { bg: 'bg-[#FBF2EE]', iconBg: 'bg-[#FAECE7]', text: 'text-[#993C1D]', solid: 'bg-[#993C1D]' },
  'prestamos-hipotecarios': { bg: 'bg-[#FBF2EE]', iconBg: 'bg-[#FAECE7]', text: 'text-[#993C1D]', solid: 'bg-[#993C1D]' },
  remesas: { bg: 'bg-[#F2F1FD]', iconBg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', solid: 'bg-[#3C3489]' },
  seguros: { bg: 'bg-[#F2F1FD]', iconBg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', solid: 'bg-[#3C3489]' },
  inversiones: { bg: 'bg-[#F4FBF8]', iconBg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', solid: 'bg-[#3B6D11]' },

  'cuentas-empresariales': { bg: 'bg-[#EEF6FC]', iconBg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]', solid: 'bg-[#185FA5]' },
  'tarjetas-corporativas': { bg: 'bg-[#FDF6EA]', iconBg: 'bg-[#FAEEDA]', text: 'text-[#854F0B]', solid: 'bg-[#B4790A]' },
  'financiamiento-comercial': { bg: 'bg-[#FBF2EE]', iconBg: 'bg-[#FAECE7]', text: 'text-[#993C1D]', solid: 'bg-[#993C1D]' },
  'nomina-pagos': { bg: 'bg-[#F4FBF8]', iconBg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', solid: 'bg-[#3B6D11]' },
  'comercio-exterior': { bg: 'bg-[#F2F1FD]', iconBg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', solid: 'bg-[#3C3489]' },
}

export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  bg: 'bg-gray-50',
  iconBg: 'bg-gray-100',
  text: 'text-gray-600',
  solid: 'bg-gray-400',
}

export function getCategoryStyle(slug: string): CategoryStyle {
  return CATEGORY_STYLES[slug] ?? DEFAULT_CATEGORY_STYLE
}
