# Plan — IS Instalaciones: landing de escombros + salto a web profesional

- **Objetivo:** (F1-F2) landing de "Retirada de escombros y limpieza de obra en Barcelona" con la paleta IS y diseño de alto impacto (GSAP), lista para colgar del subdominio. (F3-F7, desde 2026-10-01) llevar la web y el estimador a nivel profesional (tipografía, iconos, presentación), reforzar el SEO y dejar la analítica GA4/GTM medida y verificada.
- **Estado:** en curso · **Actualizado:** 2026-10-01
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
| F3 | Base visual pro: design system del sitio, tipografía autoalojada, iconos y componentes base | todo |
| F4 | Páginas rediseñadas (home, servicios, nosotros, contacto) con imágenes `astro:assets` | todo |
| F5 | Estimador con acabado profesional (panel, editor, 3D, presupuesto, móvil) | todo |
| F6 | SEO: on-page corregido, schema completo, OG por página y Core Web Vitals medidos | todo |
| F7 | Analítica: consentimiento RGPD correcto, plan de medición y GA4/GTM verificados en tiempo real | todo |

## Cambios al plan
- **2026-10-01:** el usuario pide que la web y el estimador se vean más profesionales (fuente, presentación, iconos), mejorar el SEO y revisar si GA4 está bien usado. Se añaden F3-F7. Diagnóstico de partida (evidencia):
  - El sitio principal no carga ninguna fuente: `global.css:12` usa `font-family: system-ui`. Solo `/escombros` usa Outfit + Work Sans, y lo hace desde Google Fonts remoto (`escombros/index.astro:43`), que es un riesgo RGPD.
  - Metas sin tildes en las páginas clave: "Fontaneria", "2 anos de garantia" (`index.astro:43`, `Layout.astro` por defecto). La marca aparece como "IS.INSTALACIONES" y "IS INSTALACIONES". `nosotros` se titula "Sobre Mí". La imagen OG es el logo.
  - Analítica: Consent Mode v2 y GTM se cargan tras el consentimiento, y hay eventos al `dataLayer` (bien). En contra: la casilla "Analíticas" viene marcada por defecto (`CookieBanner.astro`), lo que no vale como consentimiento RGPD; no hay forma de cambiar el consentimiento después; y desde el código no se puede saber si GTM tiene activadores y etiquetas GA4 para esos eventos.

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

## Ad hoc

### X-T1 · Erratas SEO urgentes  [S] [todo]
- Skill: marketing-seo → references/seo-onpage.md §on-page
- Archivos: `src/layouts/Layout.astro`, `src/pages/index.astro`, `src/pages/estimador.astro`, `src/pages/nosotros.astro`, `src/components/ui/Footer.astro`
- Hecho cuando: tildes correctas en titles, descriptions y schema ("años", "fontanería", "climatización", "técnicos"); marca unificada como "IS Instalaciones" en titles, OG y footer; `nosotros` sin "Sobre Mí".
- Verificar: `grep` en el build (`dist/`) sin "anos de garantia" ni "IS.INSTALACIONES"; build en verde.
- Depende de: —

### X-T2 · `astro check` en verde (13 errores preexistentes)  [S] [todo]
- Skill: code-quality → references/astro.md
- Archivos: `src/components/cta/CTA.astro` (HTML roto y sin usar en ningún sitio), `src/components/sections/Hero.astro` y `GlitchSlider.astro` (tipos de Swiper en los callbacks `on`), `src/data/immersiveContent.ts` (falta `id` en 4 servicios)
- Hecho cuando: `npx astro check` → 0 errors. Hasta 2026-10-01 nunca se había ejecutado de verdad: faltaba `@astrojs/check` y el comando se quedaba en el prompt de instalación.
- Verificar: `npx astro check`, `npm test`, `npm run build`.
- Depende de: —

## F3 — Base visual profesional

### F3-T1 · Design system del sitio principal + 2 propuestas tipográficas  [M] [todo]
- Skill: ui-ux-pro-max → SKILL.md §flujo + `scripts/search.py --design-system -p "IS Instalaciones" --persist`; `--domain typography`
- Archivos: `design-system/is-instalaciones/MASTER.md`
- Hecho cuando: MASTER con la paleta actual conservada (#046a53 / #156051 / #0d1e23), pareja tipográfica elegida por el usuario entre 2 opciones A/B (muestra visual), escala tipográfica, radios, sombras y reglas de iconos.
- Verificar: el usuario elige A o B; MASTER revisado.
- Depende de: —

### F3-T2 · Fuentes autoalojadas y tokens `@theme`  [M] [todo]
- Skill: ui-ux-pro-max → references/pro-rules.md §tipografía; code-quality → references/astro.md §assets
- Archivos: `package.json` (@fontsource-variable/*), `src/styles/global.css`, `src/layouts/Layout.astro`, `src/pages/escombros/index.astro`
- Hecho cuando: fuentes servidas desde el propio dominio (sin fonts.googleapis), preload de la principal, `@theme` con `--font-heading`/`--font-body`, escala de tamaños y tracking; `/escombros` migrado a fuentes locales.
- Verificar: `npm run build`; en Network, 0 peticiones a fonts.googleapis/gstatic.
- Depende de: F3-T1

### F3-T3 · Sistema de iconos y componentes base  [M] [todo]
- Skill: ui-ux-pro-max → references/pro-rules.md §iconos + §estados; ui-styling (solo patrones de botón)
- Archivos: `src/components/ui/Button.astro`, `IconBadge.astro`, `SectionHeading.astro` (nuevos); uso en las secciones
- Hecho cuando: un único set (Lucide) con trazo y tamaños normalizados (16/20/24), contenedor de icono coherente; botones primario/secundario/ghost con hover, focus-visible y disabled.
- Verificar: build; inspección visual en 1440 y 375.
- Depende de: F3-T2

### F3-T4 · Header, footer y banner rediseñados  [M] [todo]
- Skill: ui-ux-pro-max → page-patterns §navegación
- Archivos: `src/components/ui/Header.astro`, `Footer.astro`, `AnnouncementBanner.astro`
- Hecho cuando: nav con jerarquía clara y CTA destacado, menú móvil accesible (teclado y aria-expanded), footer con NAP y enlaces legales ("Configurar cookies" ya añadido en F7-T1); la cinta de `AnnouncementBanner` no provoca scroll horizontal a 375 px (detectado en F7-T1: `.ticker-item` llega a right=1447).
- Verificar: ui-verify a 375/768/1440; teclado.
- Depende de: F3-T3

## F4 — Páginas rediseñadas

### F4-T1 · Home: hero y bloque de servicios  [M] [todo]
- Skill: ui-ux-pro-max → page-patterns (landing de servicios locales)
- Archivos: `src/components/sections/Hero.astro`, `HeroForm.astro`, `src/components/cta/CTAServices.astro`
- Hecho cuando: hero con propuesta de valor, prueba social y CTA claros; tarjetas de servicio con imagen `astro:assets` e icono del sistema.
- Verificar: ui-verify a 375/768/1440; Lighthouse sin regresión de LCP.
- Depende de: F3-T4

### F4-T2 · Home: resto de secciones (cómo trabajamos, reseñas, contacto)  [M] [todo]
- Skill: ui-ux-pro-max → page-patterns
- Archivos: `HowWeWork.astro`, `GlitchSlider.astro`, `CTARenovations.astro`, `CTAReviews.astro`, `ContactSection.astro`
- Hecho cuando: secciones coherentes con el design system, sin `console.log` (`CTAReviews.astro:88`) y estados de carga y error en las reseñas.
- Verificar: ui-verify; consola limpia.
- Depende de: F4-T1

### F4-T3 · Plantilla de páginas de servicio  [M] [todo]
- Skill: ui-ux-pro-max → page-patterns (página de servicio)
- Archivos: `src/components/services/*`, `src/pages/servicios/*.astro`
- Hecho cuando: las 4 páginas de servicio y el índice comparten la plantilla rediseñada (hero, detalle, proceso, FAQ, CTA).
- Verificar: ui-verify de 2 páginas de servicio; build.
- Depende de: F4-T1

### F4-T4 · Nosotros, contacto y 404  [M] [todo]
- Skill: ui-ux-pro-max → page-patterns
- Archivos: `src/pages/nosotros.astro`, `contacto.astro`, `404.astro`, `src/components/sections/Panoramic.astro`
- Hecho cuando: páginas rediseñadas; formulario de contacto con validación visible, estados de envío y error.
- Verificar: ui-verify; envío del formulario en dev (sin enviar correo real).
- Depende de: F4-T3

### F4-T5 · Migrar las `<img>` restantes a `astro:assets`  [M] [todo]
- Skill: code-quality → references/astro.md §imágenes
- Archivos: los `.astro` con `<img>` (31 al adoptar las convenciones)
- Hecho cuando: 0 `<img>` en `.astro` (salvo casos justificados con `dev-standards-allow`), width/height correctos y sin CLS.
- Verificar: `grep -rn "<img" src --include=*.astro` → 0; build.
- Depende de: F4-T4

## F5 — Estimador profesional

### F5-T1 · Auditoría visual del estimador  [S] [todo]
- Skill: ui-verify → references/browser-checks.md; ui-ux-pro-max → references/pro-rules.md
- Archivos: — (informe en el devlog)
- Hecho cuando: lista priorizada de problemas con captura (panel, editor 2D, 3D, presupuesto, móvil).
- Verificar: capturas a 375 y 1440.
- Depende de: F3-T3

### F5-T2 · Panel lateral y controles  [M] [todo]
- Skill: ui-ux-pro-max → references/pro-rules.md §formularios; motion-framer (solo transiciones de paneles)
- Archivos: `src/components/estimator/Panel.jsx`, `ui.jsx`
- Hecho cuando: tipografía e iconos del design system, jerarquía clara, controles con estados (hover, focus, disabled) y sin `alert()` (avisos inline).
- Verificar: `npm test` en verde; ui-verify.
- Depende de: F5-T1

### F5-T3 · Editor de plano, visor 3D y barra de herramientas  [M] [todo]
- Skill: ui-ux-pro-max → references/pro-rules.md; react-three-fiber (solo overlays y loading)
- Archivos: `PlanEditor.jsx`, `Scene3D.jsx`, `Estimator.jsx`
- Hecho cuando: toolbar coherente con tooltips, leyenda y cotas legibles, estados de carga y vacío, controles 3D descubribles.
- Verificar: `npm test`; ui-verify.
- Depende de: F5-T2

### F5-T4 · Resumen de presupuesto y CTA de solicitud  [M] [todo]
- Skill: ui-ux-pro-max → page-patterns §pricing/resumen
- Archivos: `Estimator.jsx`, `Panel.jsx`
- Hecho cuando: desglose claro (partidas, totales, aviso de estimación), CTA "Solicitar presupuesto" destacado y evento al dataLayer.
- Verificar: ui-verify; evento visible en el dataLayer.
- Depende de: F5-T3

### F5-T5 · Estimador en móvil y verificación final  [M] [todo]
- Skill: ui-verify
- Archivos: componentes del estimador
- Hecho cuando: uso completo a 375 px (paneles como bottom sheet o pestañas), sin scroll horizontal y consola limpia.
- Verificar: ui-verify a 375/768/1440.
- Depende de: F5-T4

## F6 — SEO

### F6-T1 · Auditoría SEO técnica con evidencia  [S] [todo]
- Skill: marketing-seo → SKILL.md §SEO on-page (+ checklist técnico)
- Archivos: — (informe en el devlog)
- Hecho cuando: tabla por URL (title, description, h1, canonical, schema, indexable, OG) desde el build y `sitemap-index.xml`; Lighthouse SEO y rendimiento de home y una página de servicio.
- Verificar: salida del script de auditoría y de Lighthouse pegadas.
- Depende de: —

### F6-T2 · Correcciones on-page  [M] [todo]
- Skill: marketing-seo → §on-page + §SEO local
- Archivos: `src/layouts/Layout.astro`, `src/pages/**/*.astro`
- Hecho cuando: tildes correctas en metas, marca unificada ("IS Instalaciones"), sin `meta keywords`, titles ≤60 y descriptions ≤155, un h1 por página, `nosotros` corregido, enlazado interno entre servicios.
- Verificar: re-ejecutar la auditoría de F6-T1 sin errores.
- Depende de: F6-T1

### F6-T3 · Datos estructurados completos  [M] [todo]
- Skill: marketing-seo → §schema
- Archivos: `Layout.astro`, páginas de servicio
- Hecho cuando: LocalBusiness (HomeAndConstructionBusiness) con NAP real, BreadcrumbList en todas las páginas, Service por servicio y FAQPage válido.
- Verificar: Rich Results Test / validator.schema.org sin errores (capturas).
- Depende de: F6-T2

### F6-T4 · Imágenes sociales y favicons  [S] [todo]
- Skill: image-gen o banner-design (OG 1200x630 con la marca); marketing-seo §OG
- Archivos: `public/og/*.jpg`, `Layout.astro`, `public/site.manifest`
- Hecho cuando: OG 1200x630 por página principal y favicon y apple-touch en PNG de tamaños correctos.
- Verificar: vista previa de OG de 2 URLs.
- Depende de: F3-T1

### F6-T5 · Core Web Vitals  [M] [todo]
- Skill: code-quality → references/performance.md
- Archivos: según hallazgos (imágenes, JS de islas, fuentes)
- Hecho cuando: Lighthouse móvil ≥90 en rendimiento, SEO y accesibilidad en home y una página de servicio (o desviación justificada).
- Verificar: Lighthouse antes y después pegados en el devlog.
- Depende de: F4-T5, F6-T2

## F7 — Analítica GA4 / GTM

### F7-T1 · Consentimiento RGPD correcto  [S] [done]
- Skill: marketing-seo → references §Consent Mode v2
- Archivos: `src/components/ui/CookieBanner.astro`, `Footer.astro`
- Hecho cuando: "Analíticas" desmarcada por defecto, botones Aceptar y Rechazar con el mismo peso visual, enlace "Configurar cookies" que reabre el panel, y el consentimiento se puede retirar.
- Verificar: en el navegador, sin aceptar no carga gtm.js; al aceptar llega `consent update`.
- Depende de: —
- Devlog: [005](../devlog/2026-10-01/005-consentimiento-cookies-rgpd.md)

### F7-T2 · Plan de medición y eventos unificados  [M] [todo]
- Skill: marketing-seo → §GA4 + §GTM dataLayer
- Archivos: `src/components/ui/AnalyticsEvents.astro`, `Estimator.jsx`, `docs/medicion.md`
- Hecho cuando: catálogo de eventos con nombres GA4 (`generate_lead`, `click_whatsapp`, `click_phone`, `estimator_start`, `estimator_quote_request`…) y sus parámetros, documentado e implementado.
- Verificar: eventos vistos en el `dataLayer` en el navegador (captura).
- Depende de: F7-T1

### F7-T3 · Configurar y verificar GTM + GA4  [M] [todo]
- Skill: marketing-seo → §GTM + §GA4 + MCPs de analítica
- Archivos: — (contenedor GTM-5L2DX9HF, propiedad G-5WKP5VC1WL)
- Hecho cuando: en GTM, etiqueta de Google y activadores y etiquetas de evento por cada evento del plan; en GA4, eventos clave (conversiones) marcados, filtro de tráfico interno y retención de datos a 14 meses; cada evento verificado en Tag Assistant o DebugView.
- Verificar: capturas de Tag Assistant y GA4 Tiempo real. **Requiere acceso del usuario a GTM y GA4 y aprobación antes de publicar el contenedor.**
- Depende de: F7-T2

### F7-T4 · Search Console  [S] [todo]
- Skill: marketing-seo → §Search Console
- Archivos: —
- Hecho cuando: propiedad de dominio verificada, sitemap enviado y Search Console vinculado a GA4.
- Verificar: captura del sitemap "Correcto". **Requiere acceso del usuario.**
- Depende de: F6-T2
