# 014 — Auditoría SEO técnica con evidencia

- **Fecha/hora:** 2026-10-10
- **Tipo:** docs
- **Mejora a:** —
- **Tarea:** F6-T1
- **Stack:** astro

## Qué se hizo
- Script `scripts/seo-audit.mjs`: lee las URL de `dist/sitemap-0.xml` y extrae de cada una title, description, h1, canonical, robots, OG, tipos de JSON-LD, `meta keywords` e imágenes sin alt/dimensiones. Sale con código 1 si hay problemas (sirve de verificación para F6-T2).
- Auditoría de la rama (astro dev) y de producción; Lighthouse 12.8.2 móvil en home y reformas integrales.
- Informe completo: `senzu/auditoria/2026-10-10-seo.md`. JSON crudos de Lighthouse en `senzu/auditoria/lighthouse/` (ignorados en git, 3,7 MB).

## Commits
- (ver INDEX / siguiente commit) docs(seo): auditoria seo tecnica con evidencia

## Decisiones (resumen)
- La auditoría se hace por HTTP (no sobre el build) porque `output: 'server'` no genera HTML estático.
- El rendimiento de referencia es el de producción: el de `astro dev` no es representativo.

## Verificación
- `node scripts/seo-audit.mjs http://localhost:4399` → 39 problemas en 12/12 URL (tabla en el informe).
- `node scripts/seo-audit.mjs https://is-instalaciones.es` → 42 problemas; `/escombros/` da 404 en producción y está en el sitemap.
- Lighthouse prod: home 87/96/100/100 (LCP 3,8 s), reformas 85/100/100/100 (LCP 4,3 s). SEO 100 en todas.

## Próximos pasos
- F6-T2: un h1 por servicio (`Panoramic.astro`), titles ≤ 60, descriptions ≤ 155, quitar `meta keywords`; re-ejecutar el script.
- F6-T3: BreadcrumbList, Service por página, NAP real (calle, CP) y `sameAs` con la ficha de Google Business.
- F6-T5: LCP móvil < 2,5 s y CLS de la home en un build desplegado.
- Desplegar la rama para que `/escombros/` deje de dar 404 en producción.
