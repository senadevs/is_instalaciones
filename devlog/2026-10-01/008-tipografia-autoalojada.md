# 008 — Tipografía de marca autoalojada sobre la web real (F3-T1, F3-T2)

- **Fecha/hora:** 2026-10-01 12:50
- **Tipo:** feature
- **Mejora a:** —
- **Tarea:** F3-T1, F3-T2
- **Stack:** astro

## Qué se hizo
- F3-T1: `search.py --design-system` generó una base genérica (paleta azul). Se hicieron 3 maquetas en `design-system/is-instalaciones/propuestas/` (A cercana, B técnica, C mezcla). El cliente eligió la tipografía de B (Archivo en mayúsculas + Source Sans 3) con el estilo de A, **pero aclaró que no quiere una web nueva**: se conserva estructura, temas y colores. Registrado en `gustos.md`; `MASTER.md` reescrito con lo decidido (la paleta azul generada no aplica).
- F3-T2:
  - `@fontsource-variable/archivo` (`wdth.css`) y `@fontsource-variable/source-sans-3` importadas en `Layout.astro`.
  - `global.css`: `@theme` con `--font-sans` (Source Sans 3) y `--font-heading` (Archivo); `html` deja `system-ui`. Títulos con Archivo y `h1`/`h2` en mayúsculas, dentro de `@layer base` para no pisar las utilidades de los componentes.
  - `Hero.astro`: h1 de `lg:text-6xl` a `lg:text-5xl` (en mayúsculas partía "TRANSFORMAMO/S").
  - `/escombros`: Outfit y Work Sans pasan de Google Fonts remoto a `@fontsource-variable/outfit` y `@fontsource-variable/work-sans`; las clases `font-[Outfit,…]` pasan a `Outfit_Variable`; excluida de las mayúsculas forzadas (`.theme-escombros`).
- `global.css` se formateó con Prettier en un commit aparte (lo hace el hook `format-on-save`) para que el diff de este cambio quede limpio.

## Commits
- `6a075b8` style(css): formatear global.css con prettier
- feat(tipografia): archivo y source sans 3 autoalojadas (este commit)

## Decisiones (resumen; el detalle va en DECISIONES.md)
- Pulir sobre la web real en lugar de rediseñar (ver DECISIONES.md#dev-008).

## Verificación
- Capturas antes/después de la home (1440, 1440 secciones y 375) y de una página de servicio en los temas `default`, `dark-green` y `dark`: misma estructura y colores; solo cambia la tipografía. Comparación en HTML para el cliente.
- Playwright en 7 páginas: los títulos usan `Archivo Variable` en mayúsculas y el texto `Source Sans 3 Variable`; `/escombros` mantiene `Outfit Variable` sin mayúsculas y `Work Sans Variable`. **0 peticiones a fonts.googleapis/gstatic.**
- Ningún h1/h2 desborda su caja en 11 páginas × 375/768/1440.
- `npm run build`: Complete. `npx astro check`: 0 errors. `npm test`: 11 en verde.
- Desviación: sin `<link rel="preload">` de la fuente (las URLs con hash de Vite lo complican); `font-display: swap` viene de fontsource. Se revisa en F6-T5 (Core Web Vitals).
- Preexistente, anotado para F4: en el tema `dark` en móvil el botón "Probar estimador 3D" casi no se ve; la burbuja del chat tapa el título "Pide tu presupuesto" a 375 px.
- Incidencia de entorno: tras cada `npm i` el dev server se reinicia y deja recursos colgados; hay que pararlo y arrancarlo de nuevo.

## Próximos pasos
- F3-T3: iconos (un solo set, color de marca, fuera los iconos de colores dentro del texto) con antes/después en los 3 temas.
