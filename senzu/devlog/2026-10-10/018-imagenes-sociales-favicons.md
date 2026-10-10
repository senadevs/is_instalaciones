# 018 — Imágenes sociales (OG) por página y favicons

- **Fecha/hora:** 2026-10-10
- **Tipo:** feature
- **Mejora a:** 014
- **Tarea:** F6-T4
- **Stack:** astro

## Qué se hizo
- `scripts/generate-social-images.mjs` (reutilizable): genera **9 OG de 1200x630** en `public/og/` (home, servicios, 4 servicios, nosotros, contacto, estimador) renderizando con Playwright una plantilla con **foto real de obra** de `public/trabajos/`, velo verde de marca (#0d1e23 → #046a53), logo, «IS Instalaciones» (D-004), titular en Archivo mayúsculas y bajada en Source Sans 3 (D-006), web y teléfono. JPG mozjpeg de 44 a 71 KB. Recursos incrustados como data URI (una página `setContent` no lee `file://`).
- Iconos desde `public/img/logo.webp` con sharp: `favicon.ico` (16/32/48, entradas PNG), `favicon-32x32.png` (antes era un webp de 511 px con extensión .png), `apple-touch-icon.png` 180, `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` (logo al 80 % con el lienzo ampliado copiando el borde: sin costuras).
- `Layout.astro`: OG por defecto `/og/home.jpg` (antes el logo); `og:image:type/width/height` en las de `/og/`; `og:image:alt` y `twitter:image:alt` por página; enlaces a `favicon.ico`, `favicon.svg`, `favicon-32x32.png` y `apple-touch-icon.png`.
- Cada página principal pasa su `image="/og/<slug>.jpg"`.
- `site.manifest` → `site.webmanifest` (se servía como `text/cache-manifest`; ahora `application/manifest+json`), con `lang` e iconos 192/512/maskable.
- /escombros sin OG propia (usa la de la home): no sube a producción todavía (X-T9).

## Commits
- `83b2a65` feat(seo): imagenes og por pagina y favicons

## Decisiones (resumen)
- Fotos reales de obra en vez de imágenes generadas por IA: demuestran trabajo propio (E-E-A-T) y no inventan nada.
- OG generadas por script desde los datos, para regenerarlas si cambian titulares o fotos.

## Verificación
- `sharp().metadata()`: las 9 OG son 1200x630 jpeg. `file`: `favicon-32x32.png` PNG 32x32, `apple-touch-icon.png` PNG 180x180, `favicon.ico` con 3 iconos PNG.
- Metas servidas (curl en local) en `/`, `/servicios/reformas-integrales/` y `/legal/privacidad/`: og:image absoluta + type + 1200x630 + alt propio; iconos y manifest 200 con su MIME.
- Vista previa estilo WhatsApp/Facebook de 2 URL construida desde sus metas reales: `senzu/ui-verify/f6-t2/og-preview-home.png` y `og-preview-reformas.png` (fuera de git).
- `seo-audit` 0 problemas y `schema-check` 0 errores; `verify-build` types y build PASS (lint no configurado); `npm test` 11/11.

## Próximos pasos
- Tras desplegar: Sharing Debugger de Facebook / vista de WhatsApp con la URL pública (la caché de OG se refresca ahí).
- F6-T5 (Core Web Vitals) y X-T5…X-T9.
