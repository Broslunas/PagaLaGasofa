import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Política de privacidad — PagaLaGasofa",
  description: "Qué datos personales trata PagaLaGasofa, con qué finalidad y cómo ejercer tus derechos RGPD.",
};

export default function PrivacidadPage() {
  return (
    <LegalContent title="Política de privacidad" updated="30 de agosto de 2026">
      <p>
        Esta política explica qué datos personales trata PagaLaGasofa, con qué finalidad, durante cuánto tiempo y
        cómo puedes ejercer tus derechos, de acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD.
      </p>

      <h2>Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Titular:</strong> Pablo
        </li>
        <li>
          <strong>Contacto:</strong> pablo@broslunas.com
        </li>
      </ul>

      <h2>Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, correo electrónico e imagen de perfil, obtenidos al iniciar sesión con
          Google.
        </li>
        <li>
          <strong>Vehículos:</strong> marca, modelo, año, tipo de combustible y consumo medio que registras en tu
          garaje.
        </li>
        <li>
          <strong>Viajes:</strong> origen, destino, ruta, distancia, coste y reparto entre pasajeros, incluidos los
          nombres que tú mismo introduces para tus acompañantes.
        </li>
        <li>
          <strong>Gasolineras favoritas:</strong> las estaciones que guardas y el precio en el momento de guardarlas,
          para avisarte de bajadas de precio.
        </li>
        <li>
          <strong>Ubicación en vivo:</strong> si activas «compartir ubicación», tu última posición (latitud/longitud)
          mientras dura la sesión compartida.
        </li>
        <li>
          <strong>Notificaciones push:</strong> el endpoint y las claves de suscripción de tu navegador, para
          poder enviarte avisos de bajada de precio.
        </li>
        <li>
          <strong>Datos de uso:</strong> estadísticas de navegación agregadas (páginas vistas, dispositivo,
          procedencia) recogidas con analítica propia.
        </li>
      </ul>
      <p>
        Los precios y datos de gasolineras (nombre, dirección, horario, precios históricos) proceden de MITECO y no
        son datos personales.
      </p>

      <h2>Finalidad y base legítima</h2>
      <ul>
        <li>Prestar el servicio de cálculo de reparto de gasolina y consulta de precios (ejecución del servicio).</li>
        <li>Gestionar tu cuenta, tus vehículos, viajes y favoritos guardados (ejecución del servicio).</li>
        <li>Enviarte notificaciones de bajada de precio de tus favoritos (consentimiento al activar las notificaciones).</li>
        <li>Compartir tu ubicación en vivo mientras tú lo decidas activamente (consentimiento explícito por acción).</li>
        <li>Mejorar el Sitio a partir de estadísticas de uso agregadas (interés legítimo).</li>
      </ul>

      <h2>Conservación de los datos</h2>
      <p>
        Los datos de tu cuenta, vehículos, viajes y favoritos se conservan mientras mantengas la cuenta activa y se
        eliminan al darla de baja. La ubicación en vivo se elimina automáticamente al expirar o detener la sesión de
        compartición. Los viajes creados sin haber iniciado sesión se conservan asociados solo al enlace de
        compartición, sin vincularse a ninguna cuenta.
      </p>

      <h2>Destinatarios y encargados del tratamiento</h2>
      <ul>
        <li>
          <strong>Google</strong> — proveedor de inicio de sesión (OAuth). Aplica su propia política de privacidad.
        </li>
        <li>
          <strong>MongoDB Atlas</strong> — alojamiento de la base de datos de la aplicación.
        </li>
        <li>
          <strong>Google Gemini API</strong> — utilizada opcionalmente para estimar el consumo medio de un vehículo
          a partir de su marca, modelo y año (sin datos personales identificativos).
        </li>
        <li>
          <strong>Servicio de notificaciones push (Web Push/VAPID)</strong> — entrega los avisos a través del
          navegador, sin intermediarios adicionales.
        </li>
        <li>
          <strong>Analítica propia (analytics.broslunas.com)</strong> — analítica de uso autoalojada por el propio
          titular del Sitio.
        </li>
      </ul>
      <p>
        Algunos de estos proveedores pueden estar ubicados fuera del Espacio Económico Europeo (por ejemplo, en
        Estados Unidos); en esos casos la transferencia se ampara en las garantías previstas por el RGPD (cláusulas
        contractuales tipo u otro mecanismo válido del proveedor).
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad, oposición y limitación del
        tratamiento escribiendo a <strong>pablo@broslunas.com</strong>. También puedes eliminar tus vehículos, viajes
        y favoritos directamente desde tu panel, o borrar tu cuenta por completo. Si consideras que no hemos
        atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
        (aepd.es).
      </p>

      <h2>Menores de edad</h2>
      <p>El Sitio no está dirigido a menores de 14 años. No solicitamos ni recopilamos deliberadamente datos de menores de esa edad.</p>

      <h2>Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no
        autorizados, pérdida o alteración, si bien ningún sistema es completamente inviolable.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para adaptarla a cambios normativos o del servicio. Publicaremos cualquier
        cambio relevante en esta misma página junto con la fecha de última actualización.
      </p>
    </LegalContent>
  );
}
