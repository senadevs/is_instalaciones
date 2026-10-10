# 002 — Landing de retirada de escombros (/escombros)

- **Fecha/hora:** 2026-09-16
- **Tipo:** feature
- **Mejora a:** 001
- **Tarea:** F1-T1 a F1-T5
- **Stack:** astro (Astro 5 + React islands + Tailwind 4, SSR Netlify)

## Qué se hizo
- **Design system** `design-system/is-escombros/MASTER.md` generado con `ui-ux-pro-max` y la paleta
  **sobrescrita por la de marca** (verdes IS `#046a53`/`#156051`; variante industrial oscura `#101920`/`#0d1e23`
  con acento `#2fbf9a` para AA sobre oscuro). Tipografías: Outfit (títulos) + Work Sans (texto), solo en esta página.
- **Infra**: `gsap` 3 instalado; `src/lib/gsap.ts` (registro único de ScrollTrigger); tokens `--esc-*` en
  `global.css` bajo `.theme-escombros`.
- **Página `src/pages/escombros/index.astro`** (Layout + SEO + schema Service enlazado al LocalBusiness) con
  componentes nuevos en `src/components/escombros/`, todos con GSAP en `<script>` vanilla (perfil Astro híbrido,
  sin islas) y recetas de `gsap-scrolltrigger/references/es/effects-pro.md`:
  - `EscombrosHero` — parallax de fondo + reveal escalonado + CTAs (tel. y presupuesto).
  - `MarqueeServicios` — marquee infinito seamless, pausa en hover, estático con reduced-motion.
  - `BeforeAfter` — comparador con `input range` accesible + `clip-path` (§Before after slider).
  - `Contadores` — métricas al entrar en viewport (once); valor final directo con reduced-motion.
  - `ProcesoCards` — stacking cards sticky (4 pasos); blur solo desktop vía `matchMedia`.
  - `GaleriaObras` — skew-on-scroll (±6°) solo con puntero fino.
- Reutilizado: `Layout.astro` (Header/Footer/SEO), `ContactSection` como cierre (`#contacto`).

## Pendiente / provisional
- **Fotos**: son de obras existentes (`/trabajos/*`), no de escombros — sustituir por reportaje real del servicio.
- **Cifras de contadores**: "500+ contenedores" y "100% planta autorizada" son PENDIENTE-CONFIRMAR con negocio.
- **Subdominio**: falta decidir DNS/Netlify (site aparte apuntando al repo o redirect por host). Fuera de alcance.
- **F2-T1 (ui-verify)**: bloqueada — Chrome MCP devolvía "error page" con el dev server respondiendo 200;
  verificar a mano 375/768/1440, consola y contraste con `npm run dev`.

## Verificación
- `npm run build` ✓ (Netlify SSR, sin errores) · `npm test` ✓ 11/11.
- Reduced-motion cubierto en los 5 efectos; comparador usable por teclado; iconos Lucide con `aria-hidden`.

## Notas
- El init de dev-standards sobrescribió el `CLAUDE.MD` previo; el análisis original está en
  `docs/analisis-arquitectonico.md` (recuperado de git).

## Commits
- `74b030d` feat(escombros): landing de retirada de escombros con efectos GSAP (registrado el 2026-10-01)
