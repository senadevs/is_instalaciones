# 019 — Core Web Vitals: imágenes LCP responsive, fotos recomprimidas, vídeo diferido y fuente más ligera

- **Fecha/hora:** 2026-10-10
- **Tipo:** perf
- **Mejora a:** 014
- **Tarea:** F6-T5 (en curso: falta el logo de la cabecera)
- **Stack:** astro

## Cómo se midió
- `astro dev` no vale y el adaptador de Netlify no admite `astro preview`. Se midió el **mismo build con el adaptador Node** (`npm i --no-save @astrojs/node@9`, config temporal `astro.config.perf.tmp.mjs` → `dist-perf/`) servido por un servidor local con **brotli** como Netlify (sin compresión el HTML pesaba 232 KB frente a 40 KB y falseaba la medida). Temporales borrados salvo `dist-perf/` (ver próximos pasos).
- Lighthouse 12.8.2 móvil, 3 ejecuciones por página, mediana. Script en `senzu/auditoria/lighthouse/lh.sh`; JSON fuera de git.

## Diagnóstico (antes)
- LCP con «Render Delay» de 5-6 s: la imagen LCP competía con ~4 MB de peticiones:
  - `is.mp4` de 2,5 MB con `autoplay` en la slide 3 (se descargaba al cargar);
  - fotos de `/trabajos` servidas tal cual (hasta 565 KB y 2048 px);
  - `isbot.png` de 140 KB (1024 px) para un icono de 36-44 px;
  - `favicon.svg` de 277 KB enlazado en el `<head>` y usado en el footer a 24 px;
  - Archivo con el eje de anchura (90 KB) que la web no usa.
- El logo de la cabecera es una isla React (`Logo.tsx`, `client:load`) que carga React (47 KB br) en todas las páginas y el PNG original de 2250 px (157 KB).

## Qué se hizo
- **Hero de la home** (`Hero.astro`): la slide 1 (LCP) pasa a `<Picture>` avif/webp con `widths` 640/828/1080/1600, `sizes="100vw"`, `fetchpriority="high"` y calidad 58 (van bajo un velo negro del 60 %); las slides 2 y 4 también responsive con `loading="lazy"` y `fetchpriority="low"`. El vídeo sin `autoplay` y con `preload="none"`: lo arranca el slider al llegar a su slide (`play().catch()`).
- **Cabecera de los servicios** (`Panoramic.astro`): la rama de imagen importada usa `<Picture>` responsive con prioridad alta; las 4 páginas de servicio importan su foto desde `src/assets/trabajos/` (copia de los 5 originales LCP; el resto de `/trabajos` se migra en F4-T5).
- **`public/trabajos/*.jpeg` recomprimidas** a 1600 px como máximo, mozjpeg calidad 78 (8,7 MB → 4,8 MB), mismas URL. Originales en git.
- `isbot.png` a 96 px (140 KB → 4 KB). Footer: el icono pasa de `/favicon.svg` (277 KB) a `logo.png` con `<Image>` de 48 px en webp. Fuera el `<link rel="icon" svg>`.
- Fuente: `@fontsource-variable/archivo` (eje de peso, 35 KB) en lugar de `wdth.css` (90 KB); no hay `font-stretch` en el proyecto.
- **Regresión de F6-T2 corregida:** el título de la cabecera de los servicios pasó de `h1` a `p` y perdió Archivo en mayúsculas (va ligado a h1/h2 en `global.css`). Ahora el `<p>` lleva `font-heading uppercase` (comprobado en los 3 temas, un solo h1).

## Commits
- `3f24bba` perf(web): imagenes lcp responsive, fotos recomprimidas y video diferido

## Verificación (Lighthouse móvil, mediana de 3, build de producción con brotli)
| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| home antes | 72 (72/72/72) | 96 | 100 | 100 | 2,4 s | 6,2 s | 0 ms | 0 |
| home después | 86 (85/86/90) | 96 | 100 | 100 | 2,0 s | 3,2 s | 180 ms | 0 |
| reformas antes | 73 (72/73/77) | 99 | 100 | 100 | 2,1 s | 6,6 s | 0 ms | 0 |
| reformas después | 94 (93/94/94) | 99 | 100 | 100 | 1,7 s | 2,6 s | 0 ms | 0 |
- Peso de la home: 3,85 MB → ~0,9 MB transferidos.
- Playwright sobre el build: en móvil el hero sirve `w=828` avif; el vídeo no se descarga al cargar (`readyState` 0) y se reproduce al llegar a su slide (`readyState` 4); logo del footer bien; sin errores de consola.
- `npm run build` OK; `npm test` 11/11.

## Próximos pasos
- **Logo de la cabecera** sin JS (`LogoTema.astro`: 3 `<Image>` de 192 px y CSS por `data-theme`): bloqueado por el hook `code-hygiene` de Senzu, que trata los nombres de los temas citados en `gustos.md` («conservar los 3 temas») como vetados. Pendiente de decisión del usuario. Es lo que falta para dejar la home en ≥ 90 de forma estable.
- Borrar `dist-perf/` (el guard bloquea `rm -rf`; lo borra el usuario) y pasar `npx astro check` (con `dist-perf/` presente se queda sin memoria analizándolo).
- F4-T5: migrar el resto de `/trabajos` a `astro:assets`.
