# Convenciones del proyecto (adoptadas con /adoptar)
<!-- dev-standards:inmutable -->
Analizado el 2026-10-01 sobre ~30 archivos (configs, estimador, componentes Astro/React, API, tests y `git log -30`).
Estas convenciones GANAN a las preferencias de dev-standards (los muros de seguridad e higiene siguen aplicando).
Para cambiarlas: borrar `conventions.md` y `conventions.json` y re-ejecutar `/adoptar`.

## Naming
- **Componentes** en `PascalCase` (`.astro`, `.jsx`, `.tsx`), agrupados por área en `src/components/<area>/`.
  Ej.: `components/escombros/ProcesoCards.astro`, `components/services/ServiceDetail.astro`, `components/estimator/PlanEditor.jsx`.
- **Módulos de lógica** en `camelCase.js`/`.ts`: `components/estimator/geometry.js`, `renderPlacement.js`, `src/lib/gsap.ts`.
- **Constantes de módulo** en `UPPER_SNAKE`: `const EPS = 0.06;` (`geometry.js:15`), `SEARCH_INDEX` (`Panel.jsx:21`), `const TZ = 'Europe/Madrid';` (`api/chat.ts:8`).
- **Idioma mixto (fijado):** identificadores técnicos en inglés (`placeRooms`, `computeWalls` en `geometry.js`);
  datos y términos de dominio en español (`pasos` en `ProcesoCards.astro:7`, `zonasFor`, `abierto` en `api/chat.ts:26`).
  **Comentarios y textos de UI en español.**

## Estructura
- `src/pages/` rutas (`servicios/*.astro`, `escombros/index.astro`), `src/pages/api/*.ts` endpoints,
  `src/components/<area>/`, `src/layouts/Layout.astro` (SEO, fuentes, schema), `src/data/*.ts` contenido tipado,
  `src/lib/` utilidades compartidas (`gsap.ts`, `type.ts`), `src/styles/global.css` tokens.
- **TS vs JS:** `components/estimator/` se mantiene en JavaScript (`.js`/`.jsx`); todo código nuevo fuera de esa carpeta va en **TypeScript**.
- **Tipos con `interface`**, incluido `interface Props` en el frontmatter de `.astro`:
  ```ts
  interface Props {
    items: DetailItem[];
  }
  const { items } = Astro.props;
  ```
  (`components/services/ServiceDetail.astro:10`). Tipos compartidos en `src/lib/type.ts` (`export interface Review`).
- **Imports relativos**, comillas simples; sin alias `@/` (no está configurado). En el estimador, con extensión `.js`:
  `import { DOOR_KINDS, WINDOW_KINDS } from './catalog.js';` (`geometry.js:7`).
- **Datos → `.map()`**: el contenido repetitivo vive en arrays (frontmatter o `src/data/*.ts`) y se renderiza con `.map()`
  (`ProcesoCards.astro:7` → `{pasos.map((p, i) => (...))}`).
- **GSAP** se importa solo desde `src/lib/gsap.ts` (punto único de registro de plugins y defaults).
- **Estimador — lógica pura separada de la UI:** `geometry.js`, `plan2d.js`, `catalog.js`, `state.js`, `renderPlacement.js`
  y `export/*.js` no importan React ni Three; solo los `.jsx` (`Scene3D.jsx`, `PlanEditor.jsx`, `Panel.jsx`) lo hacen.
- Funciones con un comentario breve en español encima; secciones largas con separadores `// ---- Título ----` (`geometry.js:30`).

## Backend (API)
- Endpoints `export const GET/POST: APIRoute` en `src/pages/api/*.ts` (`reviews.ts`, `chat.ts`).
- Secretos solo con `import.meta.env.X` en servidor (`const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY;`, `reviews.ts:5`); nunca `process.env` en `src/`.
- Errores: `try/catch`, `console.error('Contexto:', error)` y respuesta JSON con `new Response(JSON.stringify(...), { status, headers: { 'Content-Type': 'application/json' } })` (`reviews.ts:66`).
- Helpers privados como `function` declarada en el mismo archivo (`formatRelativeDate`, `getHorarioContext`).

## Front
- **Tailwind 4** (`@import "tailwindcss"` + `@source` en `global.css`) con tokens: `primary`, `--color-*`, `--esc-*`
  (`text-[color:var(--esc-accent)]`). **Nada de hex arbitrarios en clases** (`bg-[#...]`).
- En el estimador las cadenas de clases reutilizadas van en constantes (`const inp = '...'`, `Panel.jsx:17`); `style={{}}` solo para valores dinámicos (colores por dato).
- **Imágenes: el código nuevo usa `<Image />` de `astro:assets`** (con `alt`, y `loading="lazy"` fuera del viewport). Las `<img>` existentes están pendientes de migración.
- **Islas React** con la directiva más perezosa posible (`<Estimator client:only="react" />` en `estimador.astro:44`); lo no interactivo, en `.astro`.
- Animaciones de entrada declarativas con `data-animate="fade-left|fade-right|..."`; efectos GSAP en `<script>` vanilla con `matchMedia` y `prefers-reduced-motion`.
- Iconos con `astro-icon` (`<Icon name="lucide:..." />`) o `lucide-react` en islas; nada de emojis como iconos.

## Tests
- **Vitest**, archivos `*.test.js` **junto al código** (`geometry.test.js`, `export/index.test.js`); el `include` de `astro.config.mjs` solo recoge `src/**/*.test.js`.
- `import { describe, expect, test } from 'vitest';`, `describe`/`test` con descripciones en **inglés**:
  `test('keeps a sofa valid when snapping it flush to a wall', ...)` (`geometry.test.js:7`).
- Se testea la lógica pura (geometría, export); `npm test` = `vitest run`.

## Git e idioma
- Conventional Commits **en español** con scope, imperativo, ≤72 caracteres, sin co-autor:
  `feat(estimador): planta base por defecto en duplex/casa y boton Anadir planta`,
  `fix(estilos): @source para que Tailwind 4 no purgue las clases del estimador en produccion`.
- Ramas `feat/`, `fix/`, `chore/`…; nunca commit directo en `main`.

## Zonas intocables
- `node_modules/`, `dist/`, `package-lock.json` (salvo tarea de dependencias), `.env*`.
- Archivos gestionados por dev-standards (`CLAUDE.md`, `.claude/**`, `.mcp.json`, `.dev-standards.json`).
- `public/` (assets de producción): no renombrar ficheros referenciados sin actualizar sus usos.

## Pendiente de decidir
- **Linter:** no existe `npm run lint` ni configuración ESLint/Prettier.
- **Migración de las 31 `<img>` existentes a `astro:assets`** (tarea a planificar).
