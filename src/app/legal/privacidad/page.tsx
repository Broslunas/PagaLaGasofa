import type { Metadata } from "next"

import { LegalDocument } from "@/components/legal/legal-document"
import { OWNER } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos trata PagaLaGasofa, para qué, durante cuánto tiempo y cómo ejercer tus derechos.",
}

export default function PrivacyPage() {
  return (
    <LegalDocument title="Política de privacidad" current="/legal/privacidad">
      <p>
        Aquí te explicamos, sin rodeos, qué datos personales trata PagaLaGasofa, con qué finalidad, durante cuánto tiempo y
        cómo ejercer tus derechos, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>Responsable del tratamiento</h2>
      <ul>
        <li><strong>Titular:</strong> {OWNER.name}</li>
        <li><strong>Contacto para cualquier cuestión de privacidad:</strong> <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a></li>
      </ul>

      <h2>Qué datos tratamos y para qué</h2>
      <h3>Si usas la app sin cuenta</h3>
      <ul>
        <li>
          <strong>Tus tickets de viaje:</strong> ruta, paradas, importes, y los <strong>nombres de los pasajeros que tú escribes</strong>.
          Sirven para calcular y compartir el reparto. Se guardan hasta un año y se pueden borrar antes desde el propio ticket.
        </li>
        <li>
          <strong>Permiso de gestión del ticket:</strong> una cookie en tu dispositivo (y un enlace secreto opcional) que demuestra que
          puedes editar ese ticket. De cada token solo guardamos su huella cifrada.
        </li>
        <li>
          <strong>Dirección IP:</strong> para limitar el abuso de los servicios. No se guarda en claro, solo un resumen irreversible
          que se borra en 24 horas.
        </li>
        <li>
          <strong>Ubicación aproximada por IP:</strong> el servidor de alojamiento nos indica la zona aproximada solo para centrar el mapa
          o las gasolineras. No se almacena.
        </li>
        <li>
          <strong>Ubicación precisa del dispositivo:</strong> solo si pulsas «usar mi ubicación» y aceptas el permiso del navegador. Se usa
          en el momento y no se guarda, salvo en la ubicación en vivo (ver más abajo).
        </li>
      </ul>

      <h3>Si creas una cuenta</h3>
      <ul>
        <li><strong>Identificación:</strong> correo electrónico, y nombre e imagen de perfil si inicias sesión con Google.</li>
        <li><strong>Contenido que guardas:</strong> vehículos (marca, modelo, consumo), viajes, gasolineras favoritas y sus alertas de precio.</li>
        <li><strong>Notificaciones:</strong> el historial del centro de notificaciones y los dispositivos que activas para avisos push (dirección de entrega y claves de cifrado del navegador).</li>
        <li><strong>Preferencias:</strong> por ejemplo, si quieres recibir las alertas también por correo.</li>
      </ul>

      <h3>Ubicación en vivo</h3>
      <p>
        Si compartes tu ubicación, tu navegador envía tu posición actual a nuestros servidores mientras la sesión está activa. Guardamos
        <strong> únicamente la última posición</strong> (nunca un recorrido), que se borra al terminar la sesión; la sesión caduca sola
        en un máximo de 12 horas. Cualquiera que tenga el enlace puede verla mientras dure: compártelo solo con quien quieras.
      </p>

      <h3>Analítica y grabación de sesiones</h3>
      <p>
        Solo si lo aceptas en el aviso de cookies. Usamos una herramienta de estadísticas propia (analytics.broslunas.com), alojada por el
        titular, sin compartir los datos con terceros. Puedes cambiar de opinión en cualquier momento desde «Preferencias de cookies».
      </p>

      <h2>Base jurídica</h2>
      <ul>
        <li><strong>Ejecución del servicio que pides</strong> (art. 6.1.b RGPD): tickets, cuenta, vehículos, favoritas, ubicación en vivo.</li>
        <li><strong>Consentimiento</strong> (art. 6.1.a): analítica y grabación de sesiones, notificaciones push, avisos por correo, permiso de ubicación del navegador. Puedes retirarlo cuando quieras sin que afecte a lo anterior.</li>
        <li><strong>Interés legítimo</strong> (art. 6.1.f): seguridad y prevención del abuso (límites de uso).</li>
      </ul>

      <h2>Datos de otras personas</h2>
      <p>
        Al crear un ticket puedes escribir los nombres de las personas con las que viajas. Hazlo solo con nombres de pila o apodos y
        con su conocimiento. Esas personas pueden pedirte que los quites y también pueden dirigirse a nosotros.
      </p>

      <h2>Con quién compartimos datos</h2>
      <p>No vendemos datos ni los usamos para publicidad. Para prestar el servicio intervienen estos proveedores:</p>
      <table>
        <thead><tr><th>Proveedor</th><th>Para qué</th><th>Qué recibe</th></tr></thead>
        <tbody>
          <tr><td>Supabase</td><td>Base de datos, autenticación y tiempo real</td><td>Datos de cuenta y de la app</td></tr>
          <tr><td>Vercel</td><td>Alojamiento de la web</td><td>Peticiones (incluida la IP)</td></tr>
          <tr><td>Mailjet</td><td>Envío de correos (acceso por enlace y alertas)</td><td>Tu correo y el texto del mensaje</td></tr>
          <tr><td>Google</td><td>Inicio de sesión opcional</td><td>Lo que Google comparte al iniciar sesión</td></tr>
          <tr><td>OpenFreeMap, OSRM y Photon (OpenStreetMap)</td><td>Mapa, rutas y búsqueda de lugares</td><td>Coordenadas y textos de búsqueda; el mapa se descarga desde tu navegador, por lo que ven tu IP</td></tr>
          <tr><td>Servicios de notificaciones del navegador (Google, Mozilla, Apple)</td><td>Entrega de avisos push</td><td>El aviso cifrado</td></tr>
        </tbody>
      </table>
      <p>
        Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo; en ese caso se apoyan en las garantías
        previstas por el RGPD (decisiones de adecuación o cláusulas contractuales tipo).
      </p>

      <h2>Cuánto tiempo conservamos los datos</h2>
      <ul>
        <li><strong>Tickets sin cuenta:</strong> 1 año desde su creación. Con cuenta, mientras la mantengas o hasta que los borres.</li>
        <li><strong>Cuenta y su contenido:</strong> hasta que la elimines. Al hacerlo se borra todo; los tickets se eliminan o, si lo eliges, se desvinculan de ti y caducan al año.</li>
        <li><strong>Ubicación en vivo:</strong> se borra al parar la sesión o al caducar.</li>
        <li><strong>Notificaciones leídas:</strong> 90 días.</li>
        <li><strong>Resumen de IP para límites de uso:</strong> 24 horas.</li>
        <li><strong>Consentimiento de cookies:</strong> 12 meses en tu navegador.</li>
      </ul>

      <h2>Tus derechos</h2>
      <p>
        Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad. Con cuenta, lo más rápido es
        hacerlo tú mismo en <a href="/dashboard/ajustes">Ajustes</a>: descargar todos tus datos en JSON y eliminar la cuenta. Para cualquier otra
        petición escribe a <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>; responderemos en el plazo legal de un mes.
      </p>
      <p>
        Si crees que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.
      </p>

      <h2>Menores</h2>
      <p>El servicio no está dirigido a menores de 14 años. Si crees que un menor nos ha dado datos, escríbenos y los eliminaremos.</p>

      <h2>Seguridad</h2>
      <p>
        Las comunicaciones van cifradas (HTTPS), los accesos a los datos de cada cuenta están restringidos a su titular y los secretos
        (tokens de gestión) se guardan solo como huella cifrada. Ningún sistema es infalible: si hubiera una brecha que te afectara, te lo
        comunicaríamos según exige la ley.
      </p>

      <h2>Cambios en esta política</h2>
      <p>Si cambia algo relevante, actualizaremos la fecha de arriba y, cuando proceda, te lo avisaremos en la app.</p>
    </LegalDocument>
  )
}
