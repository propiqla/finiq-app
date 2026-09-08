export default function HeroIllustration() {
  return (
    <svg width="100%" viewBox="0 0 240 190" role="img" aria-labelledby="finiq-hero-illustration-title">
      <title id="finiq-hero-illustration-title">
        Ilustración de barras ascendentes con una línea de tendencia hacia arriba, representando
        el crecimiento económico
      </title>
      <rect x="0" y="0" width="240" height="190" rx="16" fill="#EAF6FB" />
      <ellipse cx="46" cy="34" rx="22" ry="10" fill="#ffffff" opacity="0.85" />
      <ellipse cx="68" cy="41" rx="16" ry="8" fill="#ffffff" opacity="0.85" />
      <circle cx="198" cy="38" r="18" fill="#EF9F27" />
      <line x1="198" y1="10" x2="198" y2="2" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
      <line x1="222" y1="20" x2="228" y2="15" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
      <line x1="222" y1="56" x2="228" y2="61" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" />
      <rect x="30" y="140" width="20" height="30" rx="3" fill="#9FE1CB" />
      <rect x="60" y="125" width="20" height="45" rx="3" fill="#5DCAA5" />
      <rect x="90" y="110" width="20" height="60" rx="3" fill="#1D9E75" />
      <rect x="120" y="90" width="20" height="80" rx="3" fill="#0F6E56" />
      <rect x="150" y="70" width="20" height="100" rx="3" fill="#085041" />
      <defs>
        <marker
          id="finiq-grow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="#185FA5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d="M40,132 L70,117 L100,102 L130,82 L160,62 L185,45"
        fill="none"
        stroke="#185FA5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd="url(#finiq-grow-arrow)"
      />
      <circle cx="176" cy="96" r="11" fill="#FAC775" />
      <text x="176" y="100" fontSize="11" fill="#854F0B" textAnchor="middle">
        $
      </text>
      <circle cx="196" cy="118" r="9" fill="#C0DD97" />
      <text x="196" y="121" fontSize="10" fill="#27500A" textAnchor="middle">
        $
      </text>
    </svg>
  )
}
