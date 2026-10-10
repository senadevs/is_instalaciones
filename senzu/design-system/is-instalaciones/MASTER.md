# Design System — IS Instalaciones (sitio principal)

> Fuente de verdad del estilo del sitio principal. `gustos.md` va por encima (vetos y preferencias del cliente).
> La landing `/escombros` tiene su propio design system: `design-system/is-escombros/MASTER.md`.
> Reescrito el 2026-10-01 tras la elección del cliente; sustituye al borrador generado por `search.py`
> (paleta azul y Outfit/Work Sans), que **no aplica**.

## Principio rector
**Pulir, no rehacer.** Se conservan la estructura de secciones, los tres temas y la combinación de colores
actual. Cada mejora se aplica sobre la web real y se enseña con capturas antes/después en los tres temas
(decisión del cliente, 2026-10-01).

## Color (se conserva tal cual; tokens en `src/styles/global.css`)
| Token | `default` | `dark-green` | `dark` |
|---|---|---|---|
| `--color-primary` | `#046a53` | `#0b443c` | `#0d1e23` |
| `--color-secondary` | `#156051` | `#043c2c` | `#1c343c` |
| `--color-text` | `#0d1e23` | `#0d1e23` | `#ffffff` |
| `--color-text-light` | `#ffffff` | `#ffffff` | `#ffffff` |
| `--color-background` | `#ffffff` | `#ffffff` | `#101920` |

- Un solo color de acento por vista: el verde de la marca. **Nada de colores distintos por servicio**
  (hoy hay ámbar, azul y cian en iconos y bordes de servicios: se retiran en F3-T3/F4).
- Contraste mínimo 4.5:1 en texto en los tres temas (pendiente: botón "Probar estimador 3D" casi invisible
  en el tema `dark` en móvil, preexistente → F4).

## Tipografía (elegida por el cliente entre las propuestas A/B, 2026-10-01)
- **Títulos:** Archivo (variable, ejes `wght` + `wdth`) → `--font-heading`. `h1` y `h2` en **mayúsculas**
  con `letter-spacing: -0.005em`; `h3`-`h6` mantienen su caja.
- **Texto:** Source Sans 3 (variable) → `--font-sans` (fuente por defecto de Tailwind).
- **Autoalojadas** con `@fontsource-variable/archivo` (`wdth.css`) y `@fontsource-variable/source-sans-3`,
  importadas en `src/layouts/Layout.astro`. Prohibido cargar Google Fonts remoto (RGPD).
- Reglas de títulos en `@layer base` para que las utilidades de cada componente (`font-[…]`, `tracking-*`,
  `normal-case`) sigan mandando.
- Tamaños: un único tamaño "wow" por vista; en mayúsculas los titulares ocupan más, así que el `h1` del
  hero de la home baja de `lg:text-6xl` a `lg:text-5xl`. Ningún `h1`/`h2` puede desbordar su caja a
  375/768/1440 px (comprobado con script en las 11 páginas).
- Cuerpo ≥ 16 px; line-height 1.5-1.7 en párrafos.

## Iconos (pendiente de aplicar en F3-T3, con antes/después)
- Un solo set: **Phosphor** (elegido en la mezcla de propuestas), peso `regular`, vía `astro-icon` +
  `@iconify-json/ph`. Hoy el sitio usa Lucide; el cambio se hace en F3-T3 y se enseña antes de seguir.
- Tamaños 16/20/24, color `currentColor` (verde de marca o blanco sobre fondos oscuros).
- **Nunca** iconos dentro de un párrafo ni en colores distintos por servicio; `aria-hidden="true"` + texto visible.

## Forma
- Estilo suave (elección del cliente): botones con esquinas redondeadas (las actuales `rounded-xl` se
  mantienen), tarjetas `rounded-2xl`, sombras suaves.
- Estados obligatorios: hover, `focus-visible` (anillo 2 px), disabled, loading en formularios.

## Referencias
- Maquetas en `propuestas/` (A cercana, B técnica, C mezcla): **solo** como referencia de tipografía y
  criterio de iconos. Su estructura no se aplica (veto del cliente en `gustos.md`).

## Checklist antes de dar por buena una vista
- [ ] Capturas antes/después en `default`, `dark-green` y `dark`.
- [ ] 375 / 768 / 1440 px sin scroll horizontal y sin títulos desbordados.
- [ ] Contraste 4.5:1 en los tres temas.
- [ ] Sin peticiones a fonts.googleapis/gstatic.
- [ ] `prefers-reduced-motion` respetado; foco visible por teclado.
