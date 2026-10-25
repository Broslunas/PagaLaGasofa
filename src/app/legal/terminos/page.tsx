import type { Metadata } from "next"

import { LegalDocument } from "@/components/legal/legal-document"
import { OWNER } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Condiciones para usar PagaLaGasofa: cuenta, tickets compartidos, datos de terceros y responsabilidad.",
}

export default function TermsPage() {
  return (
    <LegalDocument title="Términos de uso" current="/legal/terminos">
      <p>
        Estas condiciones regulan el uso de PagaLaGasofa. Al usar el Sitio las aceptas; si no estás de acuerdo, no lo uses.
      </p>

      <h2>El servicio</h2>
      <p>
        PagaLaGasofa permite calcular el coste de un viaje en coche, repartirlo entre varias personas, compartir el resultado con un
        enlace, consultar precios de gasolineras, recibir alertas de bajada y compartir tu ubicación durante un trayecto. Es gratuito y se
        ofrece «tal cual», sin garantía de disponibilidad continua: puede haber cortes, cambios o funciones que desaparezcan.
      </p>

      <h2>Cuenta</h2>
      <ul>
        <li>No necesitas cuenta para calcular y compartir un ticket. Con cuenta guardas vehículos, viajes, favoritas y alertas.</li>
        <li>Eres responsable de la actividad de tu cuenta y de mantener seguro tu acceso (Google o enlace por correo).</li>
        <li>Puedes eliminar tu cuenta y descargar tus datos cuando quieras desde Ajustes.</li>
      </ul>

      <h2>Tickets y enlaces compartidos</h2>
      <ul>
        <li><strong>Quien tiene el enlace de un ticket puede verlo.</strong> Compártelo solo con las personas que viajan contigo.</li>
        <li><strong>Quien tiene tu enlace de gestión (o el dispositivo donde se creó) puede editar el ticket y marcar pagos.</strong> No lo difundas.</li>
        <li>Los tickets sin cuenta se eliminan al año. Puedes borrarlos antes desde el propio ticket.</li>
        <li>
          «Pagado» es una marca manual. PagaLaGasofa <strong>no procesa pagos</strong> ni es parte del acuerdo entre quienes comparten el gasto:
          los importes son una propuesta de reparto, no un recibo ni una factura.
        </li>
      </ul>

      <h2>Datos de otras personas</h2>
      <p>
        Si escribes nombres de otras personas en un ticket, confirmas que puedes hacerlo y que usarás solo nombres de pila o apodos. Eres
        responsable de ese contenido.
      </p>

      <h2>Ubicación en vivo</h2>
      <p>
        Al iniciar una sesión decides compartir tu posición con quien reciba el enlace, mientras dure. Eres responsable de con quién lo compartes
        y de pararla cuando termines. No uses la función para seguir a otra persona sin que lo sepa y lo consienta.
      </p>

      <h2>Uso aceptable</h2>
      <p>
        No puedes usar el Sitio para actividades ilícitas, para suplantar a otras personas, para acceder a datos que no son tuyos, para
        sobrecargarlo o para extraer datos de forma masiva. Podemos limitar o bloquear usos que lo pongan en riesgo.
      </p>

      <h2>Precios, rutas y otros datos de terceros</h2>
      <p>
        Los precios, horarios, rutas, consumos y emisiones proceden de fuentes públicas y son orientativos (ver el{" "}
        <a href="/legal/aviso-legal">aviso legal</a>). Antes de repostar o de salir, comprueba la información que sea importante para ti.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        El código, el diseño y la marca de PagaLaGasofa son de su titular. Los datos de MITECO, de la EEA y de OpenStreetMap conservan sus
        licencias y condiciones de reutilización. Los contenidos que creas (tus tickets, vehículos y notas) siguen siendo tuyos; nos permites
        guardarlos y mostrarlos para prestarte el servicio.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, el titular no responde de daños derivados del uso del Sitio, de errores en datos de terceros, de
        interrupciones del servicio, de impagos entre usuarios ni del uso que otras personas hagan de un enlace que tú compartas. Nada de lo
        anterior limita los derechos que la ley reconoce a los consumidores.
      </p>

      <h2>Modificaciones y baja del servicio</h2>
      <p>
        Podemos modificar estas condiciones o el servicio; los cambios importantes se avisarán en el Sitio y la fecha de actualización cambiará.
        Si sigues usándolo después, se entiende que los aceptas.
      </p>

      <h2>Contacto y legislación</h2>
      <p>
        Escríbenos a <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>. Estas condiciones se rigen por la ley española; si eres consumidor,
        serán competentes los juzgados de tu domicilio.
      </p>
    </LegalDocument>
  )
}
