# 021 — Menú de la cabecera sin roles de menú y `llms.txt` en formato llmstxt.org

- **Fecha/hora:** 2026-10-10
- **Tipo:** fix
- **Mejora a:** 017
- **Tarea:** X-T10, X-T8
- **Stack:** astro

## Origen
El usuario pasó el informe de Lighthouse «Navegación agéntica»: (1) «Certain ARIA roles must contain particular children» en el `div role="menubar"` del menú; (2) «llms.txt no sigue las recomendaciones: el archivo no contiene ningún enlace». También pide WebMCP / `ai-catalog.json` → tarjeta nueva X-T11.

## Qué se hizo
- **`Header.astro` (X-T10):** fuera `role="menubar"`, `role="menu"` y los `role="menuitem"` (escritorio y móvil): es navegación de enlaces dentro de `<nav>`, no un menú de aplicación. «Servicios» deja de declararse `role="button"` con un `aria-expanded="false"` que nunca cambiaba (es un enlace a /servicios). El submenú se abre también con teclado (`group-focus-within:block`); antes solo con el ratón.
- **`public/llms.txt` (X-T8)** reescrito según llmstxt.org: H1, resumen en blockquote, datos de contacto, y secciones con listas de enlaces a las páginas canónicas con una línea de descripción (Servicios, Herramientas, Empresa y contacto, Optional). 12 enlaces. Sin /escombros (no sube a producción, X-T9) y sin decir que no hay local (regla del cliente). Fuera la lista de marcas de aire acondicionado (no aparece en ninguna página, sin respaldo) y «gratuita» y «con reseñas» (no comprobados).
- `public/llm.txt` (duplicado) retirado; `public/_redirects` lo redirige con 301 a `/llms.txt` (el build lo copia a `dist/_redirects`). En el `<head>`, un solo `<link rel="alternate" type="text/markdown">` a `/llms.txt`.

## Commits
- `e5af958` fix(seo): menu sin roles aria de menu y llms.txt con enlaces

## Verificación
- Lighthouse accesibilidad de la home (local): 96; `aria-required-children` ya no aplica (sin `menubar`), `aria-allowed-role` y `aria-allowed-attr` OK.
- Playwright: con el foco de teclado en «Servicios» el submenú pasa a `display: block` (captura `senzu/ui-verify/f6-t5/header-teclado.png`); la cabecera se ve igual.
- `curl` de los 12 enlaces de `llms.txt` contra local: 11 × 200; `/sitemap-index.xml` da 404 solo en `astro dev` (se genera en el build: está en `dist/`).
- `verify-build`: types PASS, build PASS (lint no configurado); `npm test` 11/11; `dist/llms.txt` con 12 enlaces y `dist/_redirects` con la regla.

## Próximos pasos
- X-T7 (agente del chat) y X-T11 (WebMCP / `ai-catalog.json`).
- Aviso: `CTAServices.astro:225` dice «cientos de proyectos completados» y reformas «cientos de familias»: cifras sin respaldo, como el «+500» que el cliente pidió quitar (009). Preguntar al cliente.
