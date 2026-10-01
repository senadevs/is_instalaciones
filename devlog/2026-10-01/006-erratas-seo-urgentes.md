# 006 — Erratas SEO urgentes: tildes, marca y menú (X-T1)

- **Fecha/hora:** 2026-10-01 11:55
- **Tipo:** fix
- **Mejora a:** —
- **Tarea:** X-T1
- **Stack:** astro

## Qué se hizo
- `Layout.astro`: description por defecto con tildes ("2 años de garantía", "fontanería", "técnicos"); schema LocalBusiness y OfferCatalog con tildes ("Instalaciones eléctricas", "Fontanería y saneamiento", "Climatización y calefacción", "Cornellà de Llobregat"); marca "IS Instalaciones" en `name`, `author`, `og:site_name` y `alt` de OG/Twitter; title por defecto "Instalaciones y Reformas en Barcelona | IS Instalaciones".
- Titles de todas las páginas con el patrón "… | IS Instalaciones" (antes "- IS.INSTALACIONES"); `nosotros` pasa de "Sobre Mí" a "Sobre nosotros"; 404 como "Página no encontrada (404)".
- Home: title y description con tildes; schema Service con `serviceType` y `areaServed` con tildes.
- `/estimador`: description, FAQPage (preguntas con ¿?) y todo el texto visible con tildes.
- Menú (`Header.astro`): "FONTANERÍA" y "CLIMATIZACIÓN"; **"MANTENIMIENTO" enlazaba a reformas integrales** → ahora "REFORMAS". `aria-label` del logo con la marca nueva.
- `Footer.astro`, `Logo.tsx`, `contacto.astro`, `legal/privacidad.astro`, asuntos de formularios (`ContactSection`, `HeroForm`) y chat ("Calefacción"): marca y tildes.
- `public/llms.txt` y `public/llm.txt` (idénticos) reescritos con tildes y la marca nueva.

## Commits
- fix(seo): tildes en metas y schema, marca unificada y menu de reformas (este commit)

## Decisiones (resumen; el detalle va en DECISIONES.md)
- Marca textual "IS Instalaciones" (ya se usaba así en el cuerpo de `nosotros`). Los logotipos de texto en mayúsculas del header ("IS.INSTALACIONES") y del footer ("IS INSTALACIONES") se dejan para el rediseño de F3-T4.
- `meta keywords` se mantiene sin tildes (lo que se teclea en las búsquedas); se elimina en F6-T2.

## Verificación
- `npm run build`: Complete. `npm test`: 3 archivos, 11 tests en verde. `npx astro check`: los mismos 13 errores preexistentes (X-T2), ninguno nuevo.
- `curl` a las 12 URLs del dev server: los titles salen con la marca nueva y 0 apariciones de "anos de garant", "Fontaneria,", "tecnicos autorizados", "Sobre Mí", "MANTENIMIENTO", "FONTANERIA" o "CLIMATIZACION". "IS.INSTALACIONES" queda solo en el `<span>` del logotipo del header (`Header.astro:35`), como se decidió.
- Detectado para F6-T2: 7 titles superan 60 caracteres (p. ej. reformas integrales, 81).
- Detectado para X-T2: `src/components/services/Services.astro` no se usa y enlaza a `/servicios/fontaneria` y `/servicios/climatizacion`, que no existen.

## Próximos pasos
- X-T2 (`astro check` en verde) o F3-T1 (design system + 2 propuestas tipográficas).
