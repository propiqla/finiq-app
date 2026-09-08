import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | FinIQ Venezuela',
  description:
    'Cómo FinIQ Venezuela recopila, usa y protege tu información, incluyendo el uso de cookies y anuncios de Google AdSense.',
}

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Política de Privacidad</h1>
      <p className="mb-10 text-sm text-gray-500">Última actualización: 8 de septiembre de 2026</p>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <p>
            Esta política aplica a <strong>FinIQ Venezuela</strong> (finiq.propiqla.com). Al usar
            el sitio, aceptas las prácticas descritas aquí.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">Información que recopilamos</h2>
          <p className="mb-2">Recopilamos distintos tipos de información según cómo uses el sitio:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Alertas y suscripciones:</strong> si te suscribes a alertas de tasas o
              productos, guardamos tu correo electrónico.
            </li>
            <li>
              <strong>Datos de uso:</strong> información técnica estándar (dirección IP,
              navegador, páginas visitadas) recopilada automáticamente al navegar el sitio.
            </li>
            <li>
              <strong>Cookies y almacenamiento local:</strong> usados para mostrar anuncios, si
              están activados (ver sección siguiente).
            </li>
          </ul>
          <p className="mt-2">
            FinIQ.ve es un comparador informativo: no te pedimos ni almacenamos credenciales
            bancarias, números de tarjeta ni acceso a tus cuentas financieras. Los enlaces a
            &quot;Aplicar&quot; o &quot;Ver más&quot; te llevan directamente al sitio del banco o institución
            correspondiente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">
            Publicidad y Google AdSense
          </h2>
          <p className="mb-2">
            Usamos Google AdSense para mostrar anuncios en ciertas páginas. Google y sus socios
            publicitarios pueden usar cookies y tecnologías similares para mostrar anuncios
            basados en tus visitas a este y otros sitios.
          </p>
          <p>
            Puedes revisar, administrar o desactivar la personalización de anuncios de Google en{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:underline"
            >
              adssettings.google.com
            </a>
            . Más información sobre cómo Google usa datos de sitios que utilizan sus servicios
            está disponible en{' '}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:underline"
            >
              policies.google.com/technologies/partner-sites
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">Servicios de terceros</h2>
          <p className="mb-2">Para operar el sitio, usamos los siguientes proveedores:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> — base de datos y autenticación.
            </li>
            <li>
              <strong>Google AdSense</strong> — anuncios (ver sección anterior).
            </li>
          </ul>
          <p className="mt-2">
            Cada uno de estos proveedores tiene su propia política de privacidad que rige cómo
            procesan los datos que les enviamos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">Tus derechos</h2>
          <p>
            Puedes solicitar acceso, corrección o eliminación de tu información en cualquier
            momento escribiendo a{' '}
            <a href="mailto:argiancola@gmail.com" className="text-teal-700 hover:underline">
              argiancola@gmail.com
            </a>
            . Responderemos en un plazo razonable.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">Menores de edad</h2>
          <p>
            Este sitio no está dirigido a menores de 18 años y no recopilamos intencionalmente
            información de menores.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Los cambios entran en vigencia al
            publicarse en esta página, con la fecha de actualización correspondiente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-900">Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política, escríbenos a{' '}
            <a href="mailto:argiancola@gmail.com" className="text-teal-700 hover:underline">
              argiancola@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
