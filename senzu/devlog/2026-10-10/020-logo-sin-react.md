# 020 — Logo de la cabecera sin React y cierre de Core Web Vitals

- **Fecha/hora:** 2026-10-10
- **Tipo:** perf
- **Mejora a:** 019
- **Tarea:** F6-T5
- **Stack:** astro

## Qué se hizo
- `gustos.md` reformulado con el usuario: los 3 temas del selector se conservan TAL CUAL (mismos colores, mismo logo por tema, mismo comportamiento) y se permite optimizar cómo se cargan si se ve idéntico. Ya no cita los nombres internos de los temas, que el hook `code-hygiene` tomaba por vetados.
- `src/components/ui/LogoTema.astro` sustituye a la isla React `Logo.tsx` (`client:load`, retirada): las mismas 3 imágenes (logo.png en claro, bl.png en verde oscuro, whi.png en oscuro), ahora a 192 px en WebP, apiladas, y el CSS muestra la del `data-theme` con el mismo fundido de 0,4 s (sin fundido con `prefers-reduced-motion`). Cero JS: React deja de cargarse en todas las páginas salvo el planificador.

## Commits
- `e5c0280` perf(web): logo de cabecera sin isla react

## Verificación
- Playwright en 375 y 1440 × 3 temas: se ve el logo de cada tema (192 px), cambio de tema en caliente correcto (oscuro → verde oscuro → claro) y **ningún recurso de React** en la home. Capturas en `senzu/ui-verify/f6-t5/logo-*.png`, idénticas a las anteriores.
- Lighthouse móvil, mediana de 3, build de producción con brotli (método de 019; scripts de medición guardados en `senzu/auditoria/lighthouse/`, fuera de git):

| Página | Antes (019) | Paso 2 (019) | Final | LCP final | TBT | CLS | SEO | Accesibilidad |
|---|---|---|---|---|---|---|---|---|
| home | 72 | 86 | **89** (86/89/90) | 2,8 s | 170 ms | 0 | 100 | 96 |
| reformas-integrales | 73 | 94 | **96** (96/96/96) | 2,3 s | 0 ms | 0 | 100 | 99 |

- La home pasa a 26 KB de JS y 391 KB transferidos en total (antes 3,85 MB).
- `verify-build`: types PASS, build PASS (lint no configurado); `astro check` 0 errores y 0 avisos; `npm test` 11/11.

## Cumple / desviación justificada
- Reformas ≥ 90 en rendimiento, SEO y accesibilidad: **cumple**.
- Home: SEO 100 y accesibilidad 96 cumplen; rendimiento **89 de mediana** (86-90). Lo que queda es el arranque de Swiper en el slider del hero (254 ms de script, 170 ms de bloqueo). Quitarlo o cambiar el slider sería rediseñar la home (D-005), así que se acepta como desviación. LCP 2,8 s en laboratorio con red móvil simulada; en Netlify (CDN y caché) se medirá con datos reales en Search Console (F7-T4).

## Próximos pasos
- Tras desplegar: Lighthouse sobre la URL pública y Core Web Vitals de campo en Search Console.
