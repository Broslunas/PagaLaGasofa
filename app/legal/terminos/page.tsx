import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Términos y condiciones — PagaLaGasofa",
  description: "Condiciones de uso del servicio PagaLaGasofa.",
};

export default function TerminosPage() {
  return (
    <LegalContent title="Términos y condiciones de uso" updated="30 de agosto de 2026">
      <p>
        Estos términos regulan el uso de PagaLaGasofa (el «Servicio»). Al usar el Servicio aceptas estas
        condiciones; si no estás de acuerdo, no debes utilizarlo.
      </p>

      <h2>Descripción del servicio</h2>
      <p>
        PagaLaGasofa permite calcular el reparto del gasto de combustible entre pasajeros, consultar precios de
        gasolineras en España a partir de datos públicos de MITECO, planificar rutas y, si inicias sesión, guardar
        vehículos, viajes, favoritos y recibir avisos de bajada de precio. Algunas funciones (viajes rápidos,
        enlaces de reparto) no requieren cuenta.
      </p>

      <h2>Cuenta de usuario</h2>
      <p>
        El acceso a las funciones de panel (vehículos, historial de viajes, favoritos, notificaciones) requiere
        iniciar sesión con una cuenta de Google. Eres responsable de mantener la confidencialidad de tu cuenta y de
        toda actividad realizada desde ella.
      </p>

      <h2>Uso del servicio</h2>
      <p>Te comprometes a:</p>
      <ul>
        <li>Usar el Servicio conforme a la ley y a estos términos.</li>
        <li>No intentar acceder a datos de otros usuarios ni interferir en el funcionamiento del Servicio.</li>
        <li>
          Contar con el consentimiento de terceros antes de introducir sus datos (por ejemplo, el nombre de un
          acompañante en un viaje) o de compartir con ellos un enlace que revele su ubicación.
        </li>
      </ul>

      <h2>Enlaces compartidos</h2>
      <p>
        Los tickets de viaje y las sesiones de ubicación en vivo generan un enlace único. Cualquier persona que
        reciba ese enlace puede ver la información asociada mientras siga siendo válido. Eres responsable de con
        quién compartes esos enlaces.
      </p>

      <h2>Precios y datos de terceros</h2>
      <p>
        Los precios, horarios y ubicaciones de gasolineras se obtienen del Geoportal de MITECO y se muestran a
        título orientativo, sin garantía de exactitud ni de actualización en tiempo real. PagaLaGasofa no gestiona
        ni cobra pagos por combustible: el reparto calculado es solo una referencia entre los pasajeros.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        El código, diseño y marca de PagaLaGasofa pertenecen a su titular. Los datos de gasolineras pertenecen a
        MITECO y son de carácter público.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        El Servicio se presta «tal cual» y de forma gratuita. En la medida permitida por la ley, PagaLaGasofa no se
        hace responsable de daños derivados del uso del Servicio, de la inexactitud de los datos de precios o rutas,
        ni de interrupciones o fallos técnicos del Sitio.
      </p>

      <h2>Baja de la cuenta</h2>
      <p>
        Puedes eliminar tu cuenta y los datos asociados en cualquier momento desde el panel o solicitándolo a{" "}
        <strong>pablo@broslunas.com</strong>. Nos reservamos el derecho de suspender cuentas que incumplan estos
        términos.
      </p>

      <h2>Modificaciones</h2>
      <p>
        Podemos actualizar estos términos o el propio Servicio en cualquier momento. Los cambios relevantes se
        publicarán en esta página con la fecha de última actualización.
      </p>

      <h2>Legislación aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a
        los juzgados y tribunales que correspondan según la normativa de protección de consumidores aplicable.
      </p>
    </LegalContent>
  );
}
