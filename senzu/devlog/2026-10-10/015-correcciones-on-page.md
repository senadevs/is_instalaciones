# 015 — Correcciones on-page: h1, titles, descriptions, keywords y enlazado interno

- **Fecha/hora:** 2026-10-10
- **Tipo:** fix
- **Mejora a:** 014
- **Tarea:** F6-T2
- **Stack:** astro

## Qué se hizo
- **Un h1 por página:** `Panoramic.astro` acepta `nivel` (`h1` por defecto, `p` si la página ya tiene su h1). Las 4 páginas de servicio pasan `nivel="p"`: el h1 que queda es el de la keyword («Reformas Integrales en Barcelona»…). Mismo aspecto visual. `/nosotros` sigue usando el h1 del Panoramic.
- **Titles ≤ 60 y marca «IS Instalaciones» en todos:** estimador (64→59), servicios (69→58), fontanería (69→56), eléctricas (70→56), reformas (80→51).
- **Descriptions ≤ 155:** home (180→144), estimador (168→145), servicios (174→141), eléctricas (176→152), reformas (165→145); privacidad tiene description propia (antes heredaba la genérica de 196) y la genérica del Layout baja a 144.
- **Fuera `<meta name="keywords">`** y la lista `defaultKeywords` de `Layout.astro` (ninguna página pasaba `keywords`).
- **Enlazado interno:** componente nuevo `src/components/services/RelatedServices.astro` («Otros servicios que hacemos»), en cada página de servicio antes del contacto, con los otros 3 servicios y anchors descriptivos («Fontanería y saneamiento en Barcelona»). Textos sacados del copy que ya tiene cada página (sin promesas nuevas). Reutiliza `cta-service-card` y las clases que los temas ya sobrescriben.
- `scripts/seo-audit.mjs`: las imágenes sin dimensiones pasan a la columna «avisos» (son de rendimiento/CLS, F6-T5) y no cuentan para el código de salida.
- Tildes en metas: revisadas; no quedan sin tilde (las únicas eran las keywords eliminadas). `/nosotros` ya tenía «Sobre nosotros» desde 006.

## Commits
- (ver siguiente commit) fix(seo): un h1 por pagina, metas cortas y enlazado entre servicios

## Decisiones (resumen)
- Degradar el título del Panoramic a `<p>` (no a h2) en servicios: un h2 antes del h1 rompe el orden de encabezados.
- Enlaces cruzados como bloque propio y no solo el footer: el enlace contextual pesa más y el footer ya está en todas.

## Verificación
- `node scripts/seo-audit.mjs http://localhost:4399` → `Total: 0 problema(s) en 0/12 URL.`, exit 0 (antes 39). Solo quedan avisos de imágenes sin dimensiones.
- Captura de la sección nueva en default/dark-green/dark × 375/768/1440 (`senzu/ui-verify/f6-t2/`, fuera de git): cabe en el viewport (`right` = ancho), 3 enlaces correctos, contraste bien en oscuro.
- `verify-build`: types PASS, build PASS (lint no configurado); `npm test` 11/11.
- ui-verify de reformas-integrales: los avisos (scroll horizontal por la cabecera y una tarjeta `fade-left` a 768, labels del formulario, img sin dimensiones) ya existían (012) y no vienen de la sección nueva.

## Próximos pasos
- F6-T3: BreadcrumbList, Service por página, NAP real y `sameAs` con la ficha de Google Business.
- `legal/privacidad.astro:74`: enlace escrito en Markdown (`[...](mailto:...)`) dentro del HTML, sale literal → arreglarlo en F6-T3 o F3.
