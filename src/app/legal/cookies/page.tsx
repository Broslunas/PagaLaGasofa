import type { Metadata } from "next"

import { CookiePreferencesButton } from "@/components/consent/cookie-preferences-button"
import { LegalDocument } from "@/components/legal/legal-document"

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies y almacenamiento local usa PagaLaGasofa y cómo gestionarlos.",
}

export default function CookiesPage() {
  return (
    <LegalDocument title="Política de cookies" current="/legal/cookies">
      <p>
        PagaLaGasofa usa cookies y almacenamiento local del navegador. Las <strong>imprescindibles</strong> hacen que la app funcione y no
        necesitan tu consentimiento. Las de <strong>estadísticas</strong> y <strong>grabación de sesiones</strong> solo se activan si las aceptas,
        y puedes cambiar de decisión cuando quieras.
      </p>
      <div className="not-prose">
        <CookiePreferencesButton />
      </div>

      <h2>Imprescindibles</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Para qué sirve</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td>sb-…-auth-token</td><td>Mantiene tu sesión iniciada (Supabase).</td><td>Sesión, renovable</td></tr>
          <tr><td>plg_manage_…</td><td>Demuestra que puedes gestionar un ticket concreto en este dispositivo.</td><td>1 año</td></tr>
          <tr><td>plg_live_…</td><td>Permite enviar la posición de una sesión de ubicación en vivo que has creado.</td><td>24 horas</td></tr>
          <tr><td>theme (almacenamiento local)</td><td>Recuerda el tema claro u oscuro.</td><td>Hasta que lo borres</td></tr>
          <tr><td>plg:station-fuel (almacenamiento local)</td><td>Recuerda el combustible elegido en gasolineras.</td><td>Hasta que lo borres</td></tr>
          <tr><td>plg:consent (almacenamiento local)</td><td>Guarda tu decisión sobre cookies.</td><td>12 meses</td></tr>
        </tbody>
      </table>
      <p>
        También registramos un <em>service worker</em> para las notificaciones y para mostrar una página sin conexión. Solo guarda recursos
        estáticos de la app (imágenes y código); <strong>nunca</strong> respuestas con datos personales, de sesión o de tus tickets.
      </p>

      <h2>Con tu consentimiento</h2>
      <table>
        <thead><tr><th>Origen</th><th>Finalidad</th></tr></thead>
        <tbody>
          <tr><td>analytics.broslunas.com (script de estadísticas)</td><td>Medir páginas vistas y uso general para mejorar la app. Herramienta propia del titular.</td></tr>
          <tr><td>analytics.broslunas.com (grabación de sesiones)</td><td>Reproducir cómo se navega y se usa la interfaz para detectar errores. Requiere haber aceptado las estadísticas.</td></tr>
        </tbody>
      </table>
      <p>Mientras no aceptes, no se carga ninguno de estos scripts ni se envía nada a esa herramienta.</p>

      <h2>Cómo gestionarlas</h2>
      <ul>
        <li>Con el botón «Preferencias de cookies» de esta página o del pie de cualquier página.</li>
        <li>Desde los ajustes de tu navegador: puedes bloquear o borrar cookies y almacenamiento local. Si bloqueas las imprescindibles, partes de la app (iniciar sesión, gestionar tickets) dejarán de funcionar.</li>
      </ul>
      <p>
        Más información sobre cómo tratamos tus datos en la <a href="/legal/privacidad">política de privacidad</a>.
      </p>
    </LegalDocument>
  )
}
