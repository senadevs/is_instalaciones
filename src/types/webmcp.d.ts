// Atributos declarativos de WebMCP (X-T11). Experimentales en Chrome (origin trial) y aún no incluidos
// en los tipos de Astro. Referencia: https://developer.chrome.com/docs/ai/webmcp/declarative-api
declare namespace astroHTML.JSX {
  interface FormHTMLAttributes {
    /** Nombre de la herramienta para agentes de IA (acción en snake_case). */
    toolname?: string | undefined | null;
    /** Qué hace la herramienta y cuándo debe usarla un agente. */
    tooldescription?: string | undefined | null;
    /** Envía el formulario automáticamente cuando lo invoca un agente. */
    toolautosubmit?: boolean | string | undefined | null;
  }
  interface InputHTMLAttributes {
    /** Descripción del parámetro en el esquema que genera el navegador. */
    toolparamdescription?: string | undefined | null;
  }
  interface TextareaHTMLAttributes {
    toolparamdescription?: string | undefined | null;
  }
  interface SelectHTMLAttributes {
    toolparamdescription?: string | undefined | null;
  }
}
