import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Política de cookies — PagaLaGasofa",
  description: "Qué cookies y tecnologías similares usa PagaLaGasofa y cómo puedes gestionarlas.",
};

export default function CookiesPage() {
  return (
    <LegalContent title="Política de cookies" updated="30 de agosto de 2026">
      <p>
        Una cookie es un pequeño archivo que se guarda en tu navegador al visitar un sitio web. Se usan para hacer
        funcionar el sitio, recordar tus preferencias o medir su uso. Esta página detalla las cookies y tecnologías
        similares (localStorage) que utiliza PagaLaGasofa.
      </p>

      <h2>Cookies propias necesarias</h2>
      <ul>
        <li>
          <strong>Sesión de autenticación</strong> (Auth.js/NextAuth) — mantiene tu sesión iniciada tras hacer login
          con Google. Sin ella no podrías acceder a tu panel, vehículos ni viajes guardados.
        </li>
      </ul>
      <p>Estas cookies son técnicas y necesarias para el funcionamiento del Sitio, por lo que no requieren consentimiento (art. 22.2 LSSI).</p>

      <h2>Almacenamiento local (no es una cookie, pero cumple una función similar)</h2>
      <ul>
        <li>
          <strong>Preferencia de tema</strong> (claro/oscuro) — guardada en el almacenamiento local del navegador,
          nunca se envía al servidor.
        </li>
      </ul>

      <h2>Cookies de analítica</h2>
      <p>
        Usamos un servicio de analítica autoalojado en <code>analytics.broslunas.com</code>, propiedad del mismo
        titular del Sitio, para conocer el número de visitas y páginas más usadas. Este servicio puede utilizar
        cookies o identificadores similares para distinguir sesiones de navegación de forma agregada y anónima.
        Estas cookies solo se activan con tu consentimiento cuando el Sitio incorpore un panel de configuración de
        cookies.
      </p>

      <h2>Cómo gestionar o desactivar las cookies</h2>
      <p>Puedes permitir, bloquear o eliminar las cookies desde la configuración de tu navegador:</p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/Deshabilitar+cookies+terceros" target="_blank" rel="noopener noreferrer">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>Ten en cuenta que bloquear la cookie de sesión te impedirá mantener la sesión iniciada.</p>
    </LegalContent>
  );
}
