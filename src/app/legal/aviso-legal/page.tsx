import type { Metadata } from "next"

import { LegalDocument } from "@/components/legal/legal-document"
import { OWNER } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Datos del titular, condiciones de acceso y responsabilidad de PagaLaGasofa.",
}

export default function LegalNoticePage() {
  return (
    <LegalDocument title="Aviso legal" current="/legal/aviso-legal">
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio
        Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web («PagaLaGasofa» o el «Sitio»).
      </p>
      <ul>
        <li><strong>Titular:</strong> {OWNER.name}</li>
        <li><strong>Correo electrónico de contacto:</strong> <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a></li>
        <li><strong>Dominio:</strong> {OWNER.domain}</li>
      </ul>
      <p>
        PagaLaGasofa es un proyecto personal, gratuito y sin publicidad. Si en el futuro se explotara como actividad
        económica, aquí se añadirían los datos de identificación fiscal y el domicilio.
      </p>

      <h2>Qué es PagaLaGasofa</h2>
      <p>
        Una herramienta para calcular el coste de un viaje en coche y repartirlo entre quienes viajan, consultar los
        precios de las gasolineras de España, recibir avisos cuando bajan y compartir tu ubicación durante un trayecto.
        El acceso y uso del Sitio atribuye la condición de usuario y supone aceptar este aviso legal y los{" "}
        <a href="/legal/terminos">términos de uso</a>.
      </p>

      <h2>Condiciones de acceso y uso</h2>
      <p>
        El uso es gratuito. Te comprometes a usarlo de forma lícita y diligente, sin dañar, sobrecargar o inutilizar el
        Sitio ni sus servicios, sin intentar acceder a datos de otras personas y sin automatizar peticiones de forma
        abusiva. Los servicios públicos tienen límites de uso por dirección IP para proteger su disponibilidad.
      </p>

      <h2>Propiedad intelectual y datos de terceros</h2>
      <p>
        El código, el diseño, el logotipo y los textos del Sitio pertenecen a su titular. Los datos de terceros que se
        muestran se usan según las condiciones de sus fuentes:
      </p>
      <ul>
        <li>
          <strong>Precios y horarios de gasolineras:</strong> Ministerio para la Transición Ecológica y el Reto Demográfico
          (MITECO), datos públicos reutilizables.
        </li>
        <li>
          <strong>Consumo de vehículos:</strong> Agencia Europea de Medio Ambiente (EEA), registro de emisiones de turismos
          nuevos (Reglamento UE 2019/631), datos de España.
        </li>
        <li>
          <strong>Mapas, rutas y búsqueda de lugares:</strong> © colaboradores de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>,
          mediante OpenFreeMap, OSRM y Photon.
        </li>
      </ul>

      <h2>Exclusión de responsabilidad</h2>
      <p>
        Los precios, horarios, rutas, distancias, consumos y emisiones son <strong>orientativos</strong>: provienen de
        fuentes públicas que pueden contener errores o estar desactualizadas. No sustituyen la información de tu
        vehículo, de la propia gasolinera ni de un servicio de navegación. Los importes calculados para repartir un viaje
        son una propuesta entre las personas implicadas: PagaLaGasofa no gestiona cobros, no es parte de ningún acuerdo
        entre ellas y no se responsabiliza de los impagos.
      </p>

      <h2>Enlaces a terceros</h2>
      <p>
        El Sitio incluye enlaces a servicios de terceros (por ejemplo, Google Maps para abrir una ruta o WhatsApp para
        compartir). No controlamos su contenido ni sus políticas de privacidad.
      </p>

      <h2>Legislación aplicable</h2>
      <p>
        Este aviso se rige por la legislación española. Para cualquier controversia, y si eres consumidor, serán competentes
        los juzgados y tribunales de tu domicilio.
      </p>
    </LegalDocument>
  )
}
