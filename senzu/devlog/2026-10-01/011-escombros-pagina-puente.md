# 011 — /escombros como página puente a Escombrocero + arreglo de opacidad con GSAP (X-T3)

- **Fecha/hora:** 2026-10-01 14:40
- **Tipo:** feature
- **Mejora a:** 002
- **Tarea:** X-T3
- **Stack:** astro

## Contexto
- El cliente propuso separar escombros en un proyecto independiente. Al revisar `D:\Magneto\Proyectos` apareció **`escombrocero`**, que ya es la web independiente de la empresa hermana (Astro, bilingüe ES/CA, 27 páginas, su propio git). No se creó `is_escombros` (habría sido un tercer proyecto duplicado).
- Decisión del cliente: "IS Instalaciones tendrá una vista para eso y viceversa". La landing completa de /escombros duplicaba a Escombrocero (contenido duplicado entre webs propias), así que pasa a ser una página puente.

## Qué se hizo
- `src/data/escombrocero.ts`: URL de Escombrocero en una sola constante y los 6 servicios reales (slug, nombre, resumen, icono) copiados de `escombrocero/src/data/servicios.ts`.
- `EscombrosHero.astro`: mismo diseño; textos que presentan a Escombrocero como empresa hermana; CTA principal "Ir a la web de Escombrocero" (`data-cta`).
- `ServiciosEscombrocero.astro` (nuevo): rejilla de los 6 servicios, cada uno enlazado a su página en Escombrocero.
- `Contadores.astro`: "500+" pasa a "100+" contenedores y sacas (indicación del cliente).
- `pages/escombros/index.astro`: hero + servicios + contador + CTA final (Escombrocero y teléfono). Schema `Service` con `provider` Escombrocero. Title "Escombros y limpieza de obra | IS Instalaciones".
- Borrados por falta de uso: `BeforeAfter`, `MarqueeServicios`, `ProcesoCards`, `GaleriaObras` (comprobado con grep: 0 usos).
- Acceso desde el menú (Servicios → "ESCOMBROS Y LIMPIEZA DE OBRA") y desde el footer.
- `gustos.md`: el veto de la fuente del sistema se precisa (no como fuente PRINCIPAL; como respaldo sí). Estaba redactado con el término entre acentos graves y el hook bloqueaba cualquier pila de fuentes con `system-ui`.
- **Fallo encontrado y corregido (`cfa03ac`)**: los textos del hero de escombros se quedaban congelados a media opacidad (0.66 / 0.18 / 0.02) y nunca aparecían del todo. Causa: la transición global de `opacity 0.4s` en `p, span, h1…` peleaba con GSAP. Hipótesis probada: inyectando `transition: none` en `.esc-reveal` los 6 textos llegaban a 1. Se quita `opacity` de la transición global (solo necesitaba colores para el cambio de tema).

## Commits
- `cfa03ac` fix(css): quitar la transicion global de opacidad que bloqueaba gsap
- feat(escombros): pagina puente hacia escombrocero (este commit)

## Verificación
- Playwright /escombros a 1440 y 375: contador 24 h · 100+ · 100 % · 2 años; textos del hero a opacidad 1; 0 elementos `data-animate` sin mostrar; 0 errores de consola; sin scroll horizontal. 8 enlaces externos a Escombrocero (hero, 6 servicios, CTA final).
- Home y nosotros tras quitar la opacidad de la transición: sin cambios. En la home hay 4 `data-animate` a opacidad 0, pero son la versión oculta (`offsetParent=null`) de "Cómo trabajamos" y salen igual con la transición antigua: preexistente y no visible.
- `npm run build`: Complete. `npx astro check`: 0 errors. `npm test`: 11 en verde.
- Entorno: de nuevo `504 Outdated Optimize Dep` en el dev server (ahora con GSAP); se resuelve reiniciando con `--force`.

## Pendiente
- URL de Escombrocero confirmada por el cliente: subdominio `escombros.is-instalaciones.es`. Falta corregir `escombrocero/src/config/site.ts` (declara `escombrocero.es`) en X-T4.
- X-T4: página equivalente en Escombrocero hacia IS Instalaciones.
