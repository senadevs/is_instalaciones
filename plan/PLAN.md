# Plan — Landing de escombros (subdominio) para IS Instalaciones

- **Objetivo:** landing de "Retirada de escombros y limpieza de obra en Barcelona" con la paleta IS y diseño de alto impacto (GSAP), lista para colgar del subdominio.
- **Estado:** en curso · **Actualizado:** 2026-09-16
- **Stack / perfil:** astro · Astro 5 + React islands + Tailwind 4 (SSR Netlify)
- **Brief:** `plan/brief.md` · **Design system:** `design-system/is-escombros/MASTER.md` · **Devlog:** `devlog/INDEX.md`
- **Definición de hecho global:** `npm run build` y `npm test` en verde, a11y básica (contraste AA, reduced-motion, teclado), sin secretos, devlog al día, sin deploy.

## Alcance
- **IN:** página `/escombros` en este mismo repo (layout y SEO reutilizados), efectos GSAP en `<script>` vanilla (perfil Astro híbrido), copy real del sector, schema Service.
- **OUT (explícito):** alta del subdominio en Netlify/DNS (decisión de despliegue del usuario); fotos definitivas del servicio (se usan las de obra existentes como provisionales); estimador/chat en esta página.
- **Supuestos:** mismo negocio y datos de contacto (tel. 637 591 736); el subdominio apuntará a este repo (redirect o site Netlify aparte).
- **Riesgos:** fotos provisionales no específicas de escombros; efectos con coste móvil (mitigado con matchMedia y reduced-motion).

## Fases
| Fase | Entregable verificable por el usuario | Estado |
|---|---|---|
| F1 | Página `/escombros` completa con efectos, build en verde | done |
| F2 | Verificación en navegador (375/768/1440, dark, consola) y ajustes | todo |

---

## F1 — Landing de escombros

### F1-T1 · Preparar GSAP y tokens del tema oscuro  [S] [done]
- Skill: gsap-scrolltrigger → references/es/astro.md §2
- Archivos: `src/lib/gsap.ts`, `src/styles/global.css` (tokens `--esc-*`), `package.json`
- Hecho cuando: `import { gsap } from '../lib/gsap'` funciona y los tokens existen.
- Verificar: `npm run build`
- Depende de: —

### F1-T2 · Hero con parallax + reveal y marquee de servicios  [M] [done]
- Skill: ui-ux-pro-max → page-patterns (landing servicio) + gsap-scrolltrigger → effects-pro.md §Marquee, §Parallax en contenedor
- Archivos: `src/components/escombros/EscombrosHero.astro`, `MarqueeServicios.astro`
- Hecho cuando: hero oscuro con titular grande, parallax sutil de fondo, marquee infinito pausable.
- Verificar: scroll en dev; reduced-motion deja estado final legible.
- Depende de: F1-T1

### F1-T3 · Slider antes/después  [M] [done]
- Skill: gsap-scrolltrigger → effects-pro.md §Before after slider
- Archivos: `src/components/escombros/BeforeAfter.astro`
- Hecho cuando: comparador accesible (input range) con clip-path, sin CLS.
- Verificar: teclado (flechas) y arrastre táctil.
- Depende de: F1-T1

### F1-T4 · Proceso con stacking cards + contadores  [M] [done]
- Skill: gsap-scrolltrigger → effects-pro.md §Stacking cards; contadores con ScrollTrigger once
- Archivos: `src/components/escombros/ProcesoCards.astro`, `Contadores.astro`
- Hecho cuando: 4 pasos apilables (sticky) y métricas que cuentan al entrar en viewport.
- Verificar: móvil sin blur (matchMedia); reduced-motion sin tweens.
- Depende de: F1-T1

### F1-T5 · Galería de trabajos con skew-on-scroll + página y SEO  [M] [done]
- Skill: gsap-scrolltrigger → effects-pro.md §Scroll velocity skew; ui-ux-pro-max §checklist
- Archivos: `src/components/escombros/GaleriaObras.astro`, `src/pages/escombros/index.astro`
- Hecho cuando: página completa con Layout, schema Service, CTA de contacto y checklist pasado.
- Verificar: `npm run build` + `npm test` en verde.
- Depende de: F1-T2, F1-T3, F1-T4

## F2 — Verificación en navegador

### F2-T1 · ui-verify de la página  [S] [blocked]
- Skill: ui-verify → references/browser-checks.md
- Archivos: —
- Bloqueada: Chrome MCP no cargó localhost (error page con el server en 200); verificar a mano con `npm run dev`.
- Hecho cuando: 375/768/1440 sin scroll horizontal, consola limpia, contraste AA, foco visible.
- Verificar: navegador real con `npm run dev`.
- Depende de: F1-T5
