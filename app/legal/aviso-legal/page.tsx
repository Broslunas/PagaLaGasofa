import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Aviso legal — PagaLaGasofa",
  description: "Datos identificativos, condiciones de acceso y responsabilidad del sitio PagaLaGasofa.",
};

export default function AvisoLegalPage() {
  return (
    <LegalContent title="Aviso legal" updated="30 de agosto de 2026">
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de
        Comercio Electrónico (LSSI-CE), se informa de los siguientes datos del titular de este sitio web
        («PagaLaGasofa», el «Sitio»):
      </p>
      <ul>
        <li>
          <strong>Titular:</strong> Pablo
        </li>
        <li>
          <strong>Correo electrónico de contacto:</strong> pablo@broslunas.com
        </li>
        <li>
          <strong>Dominio:</strong> pagalagasofa.broslunas.com
        </li>
      </ul>
      <p>
        PagaLaGasofa es un proyecto personal sin ánimo de lucro. NIF/CIF y domicilio solo son exigibles si el Sitio
        se explota como actividad económica registrada (autónomo/empresa); si ese es tu caso, añade esos datos aquí.
      </p>

      <h2>Objeto</h2>
      <p>
        PagaLaGasofa es una herramienta gratuita que permite calcular el reparto del gasto de combustible entre
        varios pasajeros, consultar precios de gasolineras en España y planificar rutas. El acceso y uso del Sitio
        atribuye la condición de usuario y supone la aceptación de este aviso legal.
      </p>

      <h2>Condiciones de acceso y uso</h2>
      <p>
        El uso del Sitio es gratuito. El usuario se compromete a hacer un uso lícito, diligente y correcto,
        absteniéndose de utilizarlo con fines ilícitos, lesivos de derechos de terceros o que puedan dañar,
        inutilizar o sobrecargar el Sitio o impedir su normal utilización.
      </p>

      <h2>Propiedad intelectual e industrial</h2>
      <p>
        El código, diseño, logotipos, textos y demás contenidos del Sitio son titularidad de PagaLaGasofa o se
        utilizan con la correspondiente autorización, salvo los datos de precios de carburantes, que proceden del
        Geoportal del{" "}
        <a href="https://geoportalgasolineras.es" target="_blank" rel="noopener noreferrer">
          Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO)
        </a>{" "}
        y son de titularidad pública.
      </p>

      <h2>Exclusión de responsabilidad</h2>
      <p>
        Los precios, horarios y ubicaciones de las gasolineras se muestran a título orientativo a partir de datos
        públicos de MITECO, que pueden no reflejar el precio real en el momento de repostar. Las distancias y rutas
        calculadas son estimaciones y no sustituyen la información del propio vehículo o de servicios de
        navegación. PagaLaGasofa no se hace responsable de las decisiones tomadas a partir de estos datos ni de la
        exactitud de los enlaces a Google Maps u otros servicios de terceros integrados en el Sitio.
      </p>

      <h2>Enlaces a terceros</h2>
      <p>
        El Sitio puede incluir enlaces a sitios de terceros (por ejemplo, Google Maps para abrir rutas).
        PagaLaGasofa no controla ni se responsabiliza del contenido o las políticas de privacidad de esos sitios.
      </p>

      <h2>Legislación aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier controversia derivada del acceso o
        uso del Sitio, las partes se someten a los juzgados y tribunales que correspondan según la normativa de
        protección de consumidores aplicable.
      </p>
    </LegalContent>
  );
}
