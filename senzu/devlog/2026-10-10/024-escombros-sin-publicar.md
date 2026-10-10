# 024 — /escombros sin publicar: preparación del despliegue

- **Fecha/hora:** 2026-10-10
- **Tipo:** infra
- **Mejora a:** 011
- **Tarea:** X-T9 (en curso: falta el despliegue, pendiente de aprobación)
- **Stack:** astro

## Qué se hizo
- `src/data/escombrocero.ts`: `PUBLICAR_ESCOMBROS = false` (constante en código, preferencia del usuario frente a variables de entorno).
- Con `false`: fuera del submenú de Servicios (`Header.astro`) y del footer (`Footer.astro`); la página hace `Astro.rewrite('/404')` (404 + `noindex`, igual que hoy en producción); el sitemap la filtra (`astro.config.mjs`, `sitemap({ filter })`). Para publicarla: `true`.

## Commits
- (ver siguiente commit) feat(escombros): ocultar /escombros hasta aprobar su publicacion

## Verificación
- `npm run build` → `dist/sitemap-0.xml` con 10 URL y 0 de /escombros.
- Local: `/escombros/` → HTTP 404, title «Página no encontrada (404)», `robots: noindex, nofollow`; 0 enlaces a /escombros en /, /servicios/ y /contacto/.
- `verify-build`: types PASS, build PASS (lint no configurado); `npm test` 11/11.

## Despliegue (pendiente de aprobación explícita)
- Producción = Netlify desde `main` de `github.com/senadevs/is_instalaciones`. `feat/web-profesional` va 44 commits por delante de `origin/main` y no está subida: incluye lo del 2026-10-01 (tipografía, planificador, cookies RGPD, /escombros puente) y todo lo de hoy (SEO, OG, rendimiento, chat, WebMCP).
- Pasos propuestos: push de la rama → PR a `main` → revisión → merge (lo despliega Netlify) → comprobaciones en la URL pública (Rich Results Test, Lighthouse, chat, formularios, /escombros 404, /llm.txt → 301).
