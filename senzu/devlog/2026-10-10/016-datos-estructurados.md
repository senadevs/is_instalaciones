# 016 — Datos estructurados: negocio de zona de servicio, migas, Service y FAQ visible

- **Fecha/hora:** 2026-10-10
- **Tipo:** feature
- **Mejora a:** 014
- **Tarea:** F6-T3
- **Stack:** astro

## Qué se hizo
- **Negocio sin local** (confirmado por el cliente: solo domicilio fiscal). `Layout.astro`: `HomeAndConstructionBusiness` con dirección solo de localidad (Barcelona, Cataluña, ES); fuera `postalCode` 08001, `geo` y las metas `geo.position`/`ICBM` (eran el centro genérico de Barcelona). Fuera `priceRange: 'EUR'` (valor no válido). `url` fija a la home y `image`/`logo` al logo, no a la imagen de cada página.
- **Ficha de Google:** el enlace del cliente (share.google) resuelve a la ficha con CID `16190346738766346927` (comprobado en Maps: categoría «Contratista», teléfono 637 59 17 36 y web is-instalaciones.es, sin dirección). `sameAs` y `hasMap` apuntan a `https://www.google.com/maps?cid=16190346738766346927`. El antiguo `g.page/isinstalaciones` acababa en una búsqueda de Google; fuera también `wa.me` de `sameAs`.
- **`src/data/negocio.ts`:** fuente única de `SITE_URL`, `BUSINESS_ID`, `GOOGLE_BUSINESS_URL`, `AREA_SERVED` (9 municipios, los de `llms.txt`) y `serviceSchema()`.
- **BreadcrumbList automático** en todas las páginas salvo la home y las `noindex`: Inicio › secciones que existen como página (Servicios) › página actual (title sin la marca). Prop `breadcrumbs` para forzarlo.
- **`Service` por página de servicio** (`@id` propio, `provider` → negocio, `areaServed`, description = la meta). `additionalSchema` acepta array.
- **FAQ del estimador visible:** el `FAQPage` tenía 3 preguntas que no estaban en la página (Google lo considera schema engañoso). Ahora la sección «Preguntas frecuentes sobre el planificador» se pinta desde el mismo array que el schema.
- **Contraste en oscuro del estimador:** los 7 títulos `text-slate-900` salían oscuros sobre fondo oscuro (el tema solo sobrescribe `text-slate-800`). Cambiados a `text-slate-800` solo en `estimador.astro` (en `ChatBubble` hay fondos propios, por eso no se tocó la regla global).
- `public/llm(s).txt`: ficha nueva, tipo de negocio y «sin local abierto al público»; fuera CP y coordenadas.
- `scripts/schema-check.mjs`: validación estructural del JSON-LD por URL (propiedades exigidas, migas que acaban en la URL, FAQ visible, Service enlazado al negocio, sin calle/CP/geo).

## Commits
- `f61c74e` feat(seo): datos estructurados de negocio sin local, migas y service

## Decisiones (resumen)
- Negocio de zona de servicio: no publicar el domicilio fiscal ni coordenadas inventadas; la cobertura va en `areaServed`.
- FAQ: se pinta lo que declara el schema, en vez de quitar el schema.

## Verificación
- `node scripts/schema-check.mjs http://localhost:4399` → `Total: 0 error(es) en 11 URL.` (antes de mostrar la FAQ: 3 errores en `/estimador/`).
- `node scripts/seo-audit.mjs http://localhost:4399` → `Total: 0 problema(s) en 0/12 URL.`
- Capturas en `senzu/ui-verify/f6-t2/` (fuera de git): estimador en default/dark-green/dark; títulos blancos en oscuro, sin cambio en claro.
- `verify-build`: types PASS, build PASS (lint no configurado); `npm test` 11/11.
- Rich Results Test: pendiente, necesita la URL pública (tras desplegar).

## Próximos pasos
- Tras el despliegue: Rich Results Test de home, un servicio, contacto y estimador (capturas en el devlog).
- Ficha de Google: el nombre «IS Instalaciones | Reformas | Reparaciones» añade palabras clave al nombre, algo que las directrices de Google prohíben (riesgo de suspensión). Recomendar al cliente dejarlo en «IS Instalaciones».
