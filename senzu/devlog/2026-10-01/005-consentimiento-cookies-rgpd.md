# 005 — Consentimiento de cookies conforme a RGPD (F7-T1)

- **Fecha/hora:** 2026-10-01 11:35
- **Tipo:** fix
- **Mejora a:** —
- **Tarea:** F7-T1
- **Stack:** astro

## Qué se hizo
- Replanificación: el usuario pide que la web y el estimador se vean más profesionales, mejorar el SEO y revisar GA4. Se añaden F3-F7 a `plan/PLAN.md` (22 tarjetas), con el orden "arreglos rápidos y luego diseño" y el acceso a GTM y GA4 a través del Chrome del usuario.
- `CookieBanner.astro`:
  - Casilla "Analíticas" desmarcada por defecto (antes venía marcada: no es consentimiento válido).
  - "Rechazar todo" y "Aceptar todo" con el mismo peso visual (guía de cookies de la AEPD); "Configurar" como enlace con `aria-expanded`/`aria-controls`.
  - Banner con `role="dialog"` y `aria-labelledby`; `type="button"` y `focus-visible` en los botones.
  - Se puede reabrir con `[data-cookie-settings]` (o `window.openCookieSettings()`), mostrando la elección actual.
  - Al retirar el consentimiento analítico se borran las cookies `_ga*` existentes.
  - Listeners atados una sola vez (`data-ready`), y `saveConsent` tolera un `localStorage` bloqueado.
  - `z-[80]` para quedar por encima de la burbuja del chat (que tapaba "Guardar preferencias" en móvil).
- `Footer.astro`: enlace "Configurar cookies" en el bloque Legal.

## Commits
- `1c4023b` build(deps): anadir @astrojs/check y typescript para astro check
- fix(cookies): consentimiento rgpd con rechazo equivalente y revocable (este commit)

## Decisiones (resumen; el detalle va en DECISIONES.md)
- Se mantiene el modo básico de Consent Mode (GTM no carga sin consentimiento) frente al avanzado (ver DECISIONES.md#dev-005).

## Verificación
- Playwright contra `npm run dev` (Chrome MCP no carga servidores locales: mismo bloqueo que F2-T1):
  1. Sin decidir: banner visible, analítica desmarcada, `consent default` denegado, 0 peticiones a Google.
  2. Rechazar: `update` denegado, 0 peticiones a Google; tras recargar, el banner no reaparece y sigue sin GTM.
  3. Aceptar: `update` concedido y carga `gtm.js`.
  4. Aceptar → "Configurar cookies" del footer → el panel se reabre con la elección actual (`aria-expanded=true`) → retirar → `update` denegado y 0 cookies `_ga` restantes.
  0 errores de JS en todos los casos.
- **Hallazgo:** al aceptar, el contenedor GTM-5L2DX9HF carga `gtag/js` y envía `g/collect` a GA4, así que la etiqueta de Google está configurada y mide páginas vistas. Falta comprobar los eventos de conversión (F7-T3). La prueba envió alguna visita de 127.0.0.1 a GA4 (ruido mínimo; en F7-T3 se propondrá filtrar el tráfico interno).
- Capturas del banner a 375 y 1440: sin solapes; "Guardar preferencias" clicable a 375.
- `npm run build`: Complete. `npm test`: 3 archivos, 11 tests en verde.
- `npx astro check`: 13 errores, todos preexistentes y en archivos no tocados (`CTA.astro`, `Hero.astro`, `GlitchSlider.astro`, `immersiveContent.ts`). Nunca se había ejecutado de verdad: faltaba `@astrojs/check` (instalado ahora como devDependency junto con `typescript`). Tarjeta X-T2 para dejarlo en verde.
- Fuera de alcance, anotado en F3-T4: la cinta de `AnnouncementBanner` provoca scroll horizontal a 375 px.

## Próximos pasos
- X-T1: erratas SEO urgentes (tildes en metas, marca unificada, "Sobre Mí").
