# 023 — WebMCP en los formularios y redirección del formulario de contacto

- **Fecha/hora:** 2026-10-10
- **Tipo:** feature
- **Mejora a:** 021
- **Tarea:** X-T11, X-T12
- **Stack:** astro

## Investigación (fuentes oficiales, 2026-10-10)
- WebMCP declarativo (Chrome, origin trial, «sujeto a cambios»): `toolname` + `tooldescription` en `<form>`, `toolparamdescription` en los campos y `toolautosubmit` opcional; el navegador genera el JSON Schema desde el formulario; `SubmitEvent.agentInvoked` y `respondWith()` para devolver resultado al agente. https://developer.chrome.com/docs/ai/webmcp/declarative-api
- Lighthouse «Navegación agéntica»: «Formularios sin WebMCP» y «Herramientas registradas» son informativas; recomiendan nombres de acción en snake_case, descripciones de cuándo usar la herramienta y no registrar herramientas innecesarias. https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools · https://developer.chrome.com/docs/lighthouse/agentic-browsing/forms-missing-declarative-webmcp
- `ai-catalog.json`: la especificación ARD lo da como formato antiguo (ahora `/.well-known/ard.json`) y sirve para anunciar recursos para agentes (servidores MCP, agentes A2A, skills). La web no tiene ninguno y sus guías piden no publicar entradas de relleno → **no se publica** (Lighthouse: «No aplicable»). https://github.com/ards-project/ard-spec

## Qué se hizo
- **Formulario de contacto** (`ContactSection.astro`, en la home, servicios y contacto) → herramienta `solicitar_presupuesto` con descripción y `toolparamdescription` en nombre, email, teléfono, código postal y mensaje. **Sin `toolautosubmit`**: el agente rellena y la persona revisa y confirma el envío de sus datos.
- **Chat** (`ChatBubble.astro`) → herramienta `preguntar_asistente` con `toolautosubmit` (solo envía una pregunta, sin datos personales); con `agentInvoked` devuelve la respuesta del bot al agente vía `respondWith`. El input gana `name="mensaje"`, `aria-label` y `required`. El input inmersivo gana `name` y `aria-label`, pero no se registra (sería la misma herramienta duplicada).
- **Hero de la home**: sus dos formularios (escritorio y móvil) no se registran (duplicaban `solicitar_presupuesto` en la home). Además tenían los mismos `id` (`hero-nombre`…) dos veces: ahora `HeroForm` recibe `variante` y genera ids únicos (`hero-escritorio-nombre`, `hero-movil-nombre`).
- `src/types/webmcp.d.ts`: declara los atributos WebMCP en los tipos HTML de Astro (sin esto, 14 errores de `astro check`).
- **X-T12 · fallo encontrado**: el formulario de contacto tenía `redirectTo="https://thejornalia.es"`: tras enviar, el usuario acababa en otra web. Ahora `https://is-instalaciones.es` (como el del hero).

## Commits
- `c32f2ad` feat(webmcp): formularios para agentes de ia y redireccion de contacto

## Verificación
- Chrome 154 con `--enable-experimental-web-platform-features --enable-features=WebMCP,WebMCPTesting`: `document.modelContext.getTools()` en /contacto/ → `preguntar_asistente` (`mensaje`) y `solicitar_presupuesto` (`name`, `email`, `phone`, `postal_code` con `pattern [0-9]{5}`, `message`; obligatorios `name`, `email`, `postal_code`, `message`). Los campos ocultos (`accessKey`, `redirectTo`…) **no** se exponen.
- En `/`, `/servicios/fontaneria-y-saneamiento/` y `/contacto/`: exactamente 2 herramientas, 0 ids duplicados, `redirectTo` = `https://is-instalaciones.es`, 0 errores JS.
- Lighthouse 13.5.0, categoría «Agentic Browsing» con WebMCP activo: **home 1,00** y **contacto 0,98** (el 0,98 es un CLS de 0,089 de `astro dev`; en el build de producción, CLS 0). `agent-accessibility-tree`, `webmcp-registered-tools`, `webmcp-schema-validity` y `llms-txt` = 1; `ard-schema` no aplicable. `webmcp-form-coverage` (informativa) lista los 2 formularios del hero y el inmersivo, sin anotar a propósito.
- El chat sigue funcionando para una persona: «¿Trabajáis en Esplugues?» → «Sí, trabajamos en Esplugues…».
- `ui-verify` /contacto/ a 375: 10 avisos, todos previos y con tarjeta (F3, X-T6, F4); desaparece el de «campos sin label».
- `verify-build`: types PASS, build PASS (lint no configurado); `npm test` 11/11.

## Próximos pasos
- Revisar WebMCP cuando salga del origin trial (los nombres de atributos y eventos pueden cambiar).
- X-T9: desplegar sin /escombros.
