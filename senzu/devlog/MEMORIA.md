# Memoria del proyecto — IS Instalaciones

> Lo vigente en una línea por punto, con la entrada que lo explica. Detalle en `devlog/<fecha>/NNN-*.md`.
> Gustos y vetos del cliente: `design-system/is-instalaciones/gustos.md` · Convenciones: `conventions.md` · Plan: `plan/PLAN.md`.

## Decisiones vigentes
- D-001 · Guía propia en `CLAUDE.project.md`; `CLAUDE.md` lo genera dev-standards y no se edita a mano · ver 003
- D-002 · Convenciones selladas (`conventions.md/json`): idioma mixto, JS solo en `estimator/`, imágenes nuevas con `astro:assets`, commits en español · ver 004
- D-003 · Consent Mode básico: GTM solo tras consentimiento, "Analíticas" desmarcada por defecto, revocable desde el footer · ver 005
- D-004 · Marca textual "IS Instalaciones" en titles, OG, schema y footer (el logotipo en mayúsculas se revisa en F3-T4) · ver 006
- D-005 · Pulir la web real, NO rediseñar: se conservan estructura, los 3 temas y los colores; cada cambio con antes/después en los 3 temas · ver 008
- D-006 · Tipografía: Archivo (h1/h2 en mayúsculas) + Source Sans 3, autoalojadas con fontsource; Google Fonts remoto prohibido · ver 008
- D-007 · Planificador: color por tipo de estancia = leyenda; acentos de interfaz en verde de marca; cotas del editor por dentro de cada estancia (la exportación no cambia) · ver 010
- D-008 · /escombros es página puente a Escombrocero (empresa hermana, web propia en el subdominio escombros.is-instalaciones.es); no duplicar su contenido · ver 011

## Reglas del cliente
- Paleta verde (#046a53 / #156051 / #0d1e23) intocable; se mejora la presentación, no los colores · ver 008
- Sin cifras sin respaldo: "más de 500 proyectos" retirado de toda la web y del chat · ver 009
- Analítica: GTM-5L2DX9HF + GA4 G-5WKP5VC1WL (la etiqueta de GA4 ya mide páginas vistas) · ver 005

## Lo que no funcionó (no repetir)
- Maquetas A/B/C planteadas como web nueva: el cliente las rechazó por omitir temas y colores; solo valen como referencia tipográfica · ver 008
- Transición CSS global de `opacity` en textos: congela las animaciones GSAP a media opacidad · ver 011
- Chrome MCP no carga servidores locales (localhost ni 127.0.0.1): verificar la web local con Playwright · ver 005
- Dev server tras `npm i` o imports nuevos: `504 Outdated Optimize Dep` → reiniciar con `astro dev --force` · ver 010, 011
- `verify-build` daba "types PASS" sin `@astrojs/check` instalado (el comando se quedaba en el prompt): ya instalado · ver 005
- `vectorEffect="non-scaling-stroke"` con grosores < 1: líneas invisibles (el grosor pasa a píxeles de pantalla) · ver 010

## Pendientes abiertos
- X-T4: página "Instalaciones y reformas" en Escombrocero hacia IS y corregir allí `SITE.url` (declara escombrocero.es) · ver 011
- Cliente: ¿móvil del planificador con pestañas "Plano / Ajustes"? y encuadre de la vista 3D · ver 010
- Cliente: confirmar las cifras del contador de escombros (24 h, 100 %) · ver 011
- Cliente: acceso a GTM/GA4 en su Chrome para F7-T3 (conversiones) · ver 005
- Sin linter configurado (`npm run lint` no existe) · ver 004
- ui-verify (2026-10-01): imágenes sin dimensiones, tap targets < 44 px, texto < 12 px, 2 h1 en servicios → F4/F5/F6 · ver 012
- El aviso "¿Tienes dudas? Abrir asistente" tapa el hero en escritorio (propuesta: moverlo a la derecha) · ver 011
