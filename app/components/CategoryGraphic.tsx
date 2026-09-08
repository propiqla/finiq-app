// Small flat-color icon illustrations, same visual language as the hero
// graphic on the homepage (solid shapes, layered opacity for depth, no
// gradients or shadows). Each renders in `currentColor`, so the category's
// accent text color (see lib/categoryPresentation.ts) drives the fill —
// no per-icon color props needed.

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

const GRAPHICS: Record<string, (className?: string) => React.ReactNode> = {
  'cuentas-ahorro': (c) => (
    <Svg className={c}>
      <ellipse cx="16" cy="22" rx="9" ry="3.2" />
      <ellipse cx="16" cy="17" rx="9" ry="3.2" fillOpacity="0.7" />
      <ellipse cx="16" cy="12" rx="9" ry="3.2" fillOpacity="0.45" />
    </Svg>
  ),
  'cuentas-corriente': (c) => (
    <Svg className={c}>
      <rect x="5" y="9" width="22" height="15" rx="3" />
      <circle cx="23" cy="16.5" r="2.2" fillOpacity="0.5" />
    </Svg>
  ),
  'billeteras-digitales': (c) => (
    <Svg className={c}>
      <rect x="9" y="4" width="14" height="24" rx="3" />
      <rect x="12" y="8" width="8" height="12" rx="1.5" fillOpacity="0.5" />
      <circle cx="16" cy="24" r="1.4" fillOpacity="0.8" />
    </Svg>
  ),
  'tarjetas-debito': (c) => (
    <Svg className={c}>
      <rect x="4" y="8" width="24" height="16" rx="3" />
      <rect x="4" y="13" width="24" height="3" fillOpacity="0.5" />
    </Svg>
  ),
  'tarjetas-credito': (c) => (
    <Svg className={c}>
      <rect x="4" y="8" width="24" height="16" rx="3" />
      <rect x="8" y="12" width="5" height="4" rx="1" fillOpacity="0.6" />
      <rect x="8" y="19" width="12" height="2" rx="1" fillOpacity="0.5" />
    </Svg>
  ),
  'tarjetas-prepago': (c) => (
    <Svg className={c}>
      <rect x="4" y="8" width="24" height="16" rx="3" />
      <rect x="4" y="13" width="24" height="3" fillOpacity="0.5" />
      <circle cx="22" cy="20.5" r="4.5" fillOpacity="0.9" />
      <rect x="20.6" y="17.6" width="1.4" height="5.8" fill="white" />
      <rect x="19.1" y="19.1" width="5.8" height="1.4" fill="white" />
    </Svg>
  ),
  'prestamos-personales': (c) => (
    <Svg className={c}>
      <circle cx="13" cy="19" r="8" />
      <polygon points="22,9 29,9 29,16" fillOpacity="0.55" />
    </Svg>
  ),
  'prestamos-vehiculo': (c) => (
    <Svg className={c}>
      <rect x="5" y="14" width="22" height="8" rx="3" />
      <rect x="9" y="9" width="14" height="7" rx="2" fillOpacity="0.7" />
      <circle cx="10" cy="23" r="2.6" />
      <circle cx="22" cy="23" r="2.6" />
    </Svg>
  ),
  'prestamos-hipotecarios': (c) => (
    <Svg className={c}>
      <polygon points="16,5 28,15 4,15" />
      <rect x="8" y="15" width="16" height="12" fillOpacity="0.75" />
      <rect x="14" y="19" width="4" height="8" fillOpacity="0.4" />
    </Svg>
  ),
  remesas: (c) => (
    <Svg className={c}>
      <polygon points="5,17 28,7 19,28 16,19 5,17" />
      <polygon points="16,19 22,15 19,28" fillOpacity="0.5" />
    </Svg>
  ),
  seguros: (c) => (
    <Svg className={c}>
      <path d="M16 4 L27 8 V16 C27 23 22 27 16 29 C10 27 5 23 5 16 V8 Z" />
      <path
        d="M11 16 L14.5 19.5 L21 12"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  inversiones: (c) => (
    <Svg className={c}>
      <rect x="6" y="19" width="5" height="9" rx="1.5" fillOpacity="0.5" />
      <rect x="13.5" y="14" width="5" height="14" rx="1.5" fillOpacity="0.75" />
      <rect x="21" y="8" width="5" height="20" rx="1.5" />
    </Svg>
  ),
  'cuentas-empresariales': (c) => (
    <Svg className={c}>
      <polygon points="5,10 27,10 24,4 8,4" />
      <rect x="6" y="10" width="20" height="16" fillOpacity="0.7" />
      <rect x="13" y="17" width="6" height="9" fillOpacity="0.4" />
    </Svg>
  ),
  'tarjetas-corporativas': (c) => (
    <Svg className={c}>
      <path d="M12 8 a4 4 0 0 1 8 0" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="8" width="20" height="16" rx="3" fillOpacity="0.85" />
      <rect x="6" y="13" width="20" height="3" fillOpacity="0.4" />
    </Svg>
  ),
  'financiamiento-comercial': (c) => (
    <Svg className={c}>
      <polygon points="16,4 28,11 4,11" />
      <rect x="6" y="13" width="3" height="12" fillOpacity="0.7" />
      <rect x="14.5" y="13" width="3" height="12" fillOpacity="0.7" />
      <rect x="23" y="13" width="3" height="12" fillOpacity="0.7" />
      <rect x="4" y="26" width="24" height="2.5" fillOpacity="0.9" />
    </Svg>
  ),
  'nomina-pagos': (c) => (
    <Svg className={c}>
      <path d="M8 4h16v24l-3-2-3 2-3-2-3 2-3-2-3 2z" />
      <rect x="11" y="10" width="10" height="1.6" fillOpacity="0.45" />
      <rect x="11" y="15" width="10" height="1.6" fillOpacity="0.45" />
      <rect x="11" y="20" width="6" height="1.6" fillOpacity="0.45" />
    </Svg>
  ),
  'comercio-exterior': (c) => (
    <Svg className={c}>
      <line x1="16" y1="4" x2="16" y2="19" stroke="currentColor" strokeWidth="1.6" />
      <polygon points="16,5 24,18 16,18" fillOpacity="0.6" />
      <polygon points="5,19 27,19 23,27 9,27" />
    </Svg>
  ),
}

const FALLBACK = (c?: string) => (
  <Svg className={c}>
    <circle cx="16" cy="16" r="10" />
  </Svg>
)

export default function CategoryGraphic({ slug, className }: { slug: string; className?: string }) {
  const render = GRAPHICS[slug] ?? FALLBACK
  return <>{render(className)}</>
}
