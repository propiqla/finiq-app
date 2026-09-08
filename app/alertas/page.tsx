import Link from 'next/link'

export const metadata = {
  title: 'Alertas — FinIQ.ve',
  robots: { index: false, follow: true },
}

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const content =
    status === 'confirmed' ? (
      <>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Alerta confirmada</h1>
        <p className="text-gray-600">
          Te avisaremos por correo cuando detectemos un cambio significativo. Puedes cancelar en
          cualquier momento desde el enlace incluido en cada correo.
        </p>
      </>
    ) : status === 'unsubscribed' ? (
      <>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Alerta cancelada</h1>
        <p className="text-gray-600">Ya no recibirás más correos de esta alerta.</p>
      </>
    ) : (
      <>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">No pudimos procesar tu solicitud</h1>
        <p className="text-gray-600">El enlace pudo haber expirado o ya haber sido usado.</p>
      </>
    )

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      {content}
      <Link href="/" className="mt-6 inline-block text-teal-700 hover:underline">
        ← Volver a FinIQ
      </Link>
    </div>
  )
}
