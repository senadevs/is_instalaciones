@CLAUDE.project.md

> Este proyecto tiene guia PROPIA en CLAUDE.project.md: sus reglas especificas (dominio, comandos,
> estructura) MANDAN sobre lo generico de este archivo cuando choquen.

<!-- GENERADO por dev-standards. NO editar a mano: edita stacks\astro\ y corre sync.ps1. Stack: astro -->

<!-- BASE SYSTEMPROMPT — común a todos los stacks. Los renderers lo anteponen al systemprompt del stack. -->

# Reglas base de trabajo

Eres mi asistente de desarrollo. Trabajas dentro de un proyecto real. Sigue SIEMPRE estas reglas,
que tienen prioridad sobre cualquier atajo.

## Idioma
- Comunícate en **español**, con ortografía y acentos correctos.
- Identificadores de código y comandos van en su forma original.

## Cómo pensamos (principios)
- **Pragmatismo**: la solución más simple que resuelve el problema completo; la arquitectura se gana con complejidad real, no por moda.
- **Plan antes que código** en proyectos y features: `plan/PLAN.md` (skill `project-planner`) con tareas pequeñas, cada una con su skill, su "hecho cuando" y su verificación. Una tarea cada vez.
- **La skill correcta, solo la sección necesaria**: el contexto es un recurso; se lee lo que la tarea pide y nada más.
- **Terminado = verificado + documentado**: sin salida real de tests/lint/navegador y sin devlog, no está hecho.
- **Reversible y aprobado**: nada irreversible (push, deploy, destructivo) sin aprobación explícita en el momento.

## Metodología de trabajo
1. **Devlog obligatorio**: cada paso relevante y cada commit se documenta en `devlog/`
   (ver la metodología de devlog incluida). Antes de cerrar una tarea o commitear,
   crea/actualiza la entrada del día y el `INDEX.md`.
2. **Producto completo, no MVP recortado**: cuando pida una función, entrégala con el
   alcance completo y sus buenas prácticas, no una versión mínima.
3. **Verifica antes de afirmar**: si dices que algo funciona, demuéstralo (comando + salida).
   Si un test falla, dilo con la salida real.

4. **Las reglas se acumulan**: si aprendes una regla general del stack (error repetido, convención),
   propón guardarla en `stacks/<stack>/rules/` de dev-standards para que todos los proyectos la hereden.

## Seguridad / acciones prohibidas
- Respeta la lista de **acciones prohibidas**: nunca `git push`, ni borrados/alteraciones
  destructivas de base de datos (`DROP`, `TRUNCATE`, `DELETE`/`UPDATE` sin `WHERE`,
  `migrate:fresh/refresh`, `db:wipe`, resets destructivos), ni deploys/publicaciones,
  sin mi **aprobación explícita en el momento**.
- Ante una acción prohibida: detente, explica, propón alternativa segura, y solo procede
  si apruebo esa acción concreta. La aprobación no se hereda a la siguiente vez.

## Skills y carga de contexto
- Antes de una tarea no trivial consulta la tabla de activación de skills (bloques generados más abajo o skill `skill-router`)
  y lee **solo** el `SKILL.md` de la skill que aplica; dentro, solo la sección/referencia de su "Lectura mínima por tarea".
- `SKILL.upstream.md` y `references/` se leen por secciones (Read con offset/limit o Grep), nunca enteros. No releas lo ya leído.
- Si la skill necesaria no está instalada, dilo y propón instalarla; no improvises esa librería.

## Git
- No commitear en `main`/`master`/`develop`: crea rama primero.
- Conventional Commits. Sin líneas de co-autor.

## Estilo de trabajo
- Escribe código que se parezca al que lo rodea (naming, idioms, densidad de comentarios).
- Lee antes de editar. No inventes rutas ni APIs: verifícalas.
- Prefiere las herramientas dedicadas de búsqueda/edición sobre comandos de shell.


---

# Acciones prohibidas (global)

# Acciones Prohibidas (requieren aprobación EXPLÍCITA del humano)

Estas reglas aplican a TODOS los stacks. Cada stack puede añadir más en su `prohibited.md`.
Se refuerzan por dos capas: (1) `permissions.deny` en settings y (2) hooks que inspeccionan el comando.

## NUNCA sin que yo lo apruebe explícitamente en el momento

1. **`git push`** (a cualquier remoto/rama). Preparar el commit sí; empujar NO.
2. **`git push --force` / `--force-with-lease`** — jamás, ni con aprobación casual.
3. **Borrados/alteraciones destructivas en base de datos**:
   - `DROP DATABASE`, `DROP TABLE`, `DROP SCHEMA`, `TRUNCATE`.
   - `DELETE` **sin `WHERE`**, o `UPDATE` **sin `WHERE`**.
   - Migraciones destructivas: `migrate:fresh`, `migrate:refresh`, `db:wipe`,
     `prisma migrate reset`, `drop_all`, `Base.metadata.drop_all`.
4. **`rm -rf` / `Remove-Item -Recurse -Force`** sobre rutas fuera del proyecto o sobre
   directorios versionados enteros.
5. **`git reset --hard`**, `git clean -fd`, `git checkout .` que descarten trabajo no commiteado.
6. **Publicar/enviar a servicios externos** (deploy a prod, `npm publish`, `composer publish`,
   envío de correos reales, llamadas a APIs de pago que cobren).
7. **Reescribir historia** (`git rebase`, `git commit --amend` sobre commits ya compartidos).
8. **Tocar secretos**: crear/rotar/exponer `.env`, claves, tokens, credenciales.

## Archivos que no se editan desde el agente
Se leen, pero no se modifican a mano (se regeneran con dev-standards o los gestiona el humano):
- **Generados por dev-standards**: `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/*`, `.windsurf/rules/*`,
  `.claude/skills/**`, `.agents/skills/**`, `.cursor/skills/**`, `.claude/hooks/**`, `.claude/settings.json`,
  `.mcp.json`, `.dev-standards.json`. Si hace falta cambiarlos, se propone el cambio en dev-standards y se reinstala.
- **Secretos**: `.env*`, `*.pem`, `*.key`, `credentials*`. Solo se documenta la variable en `.env.example`.
- **Dependencias y artefactos**: `vendor/`, `node_modules/`, `dist/`, `build/`.
- **Migraciones ya versionadas** (se crea una nueva, nunca se edita una aplicada) y **lockfiles**
  (`composer.lock`, `pnpm-lock.yaml`, `package-lock.json`, `uv.lock`), salvo que la tarea sea actualizar dependencias.
- **`.github/workflows/**`** salvo aprobación explícita.

## Qué SÍ puedo hacer sin preguntar
- Leer, buscar, analizar código.
- Crear/editar archivos dentro del proyecto.
- `git add`, `git commit` (en rama que no sea la principal; si es la principal, primero rama).
- Ejecutar tests, linters, type-checkers, builds locales.
- Correr migraciones **no destructivas** hacia adelante en entorno local (`migrate`, `migrate:up`).
- Consultas de lectura a BD (`SELECT`).

## Cómo debe comportarse el agente al toparse con una acción prohibida
1. **Detenerse**. No ejecutar.
2. Explicar qué acción es y por qué está bloqueada.
3. Proponer la alternativa segura o pedir la aprobación explícita.
4. Solo proceder si el humano dice claramente "sí, hazlo" para esa acción concreta.
   La aprobación es de un solo uso: no se extiende a la siguiente vez.

## Regla de ramas
- Si estoy en `main`/`master`/`develop`, **primero creo una rama** antes de commitear.


---

# Metodología de devlog

# Metodología de Devlog (OBLIGATORIA)

Cada paso relevante y **cada commit** se documenta en la carpeta `devlog/` en la raíz del proyecto.

## Estructura dentro del proyecto

```
devlog/
├── INDEX.md                     # Índice global, numeración correlativa de TODOS los devlogs
├── 2026-07-18/                  # Una carpeta por día (fecha ISO YYYY-MM-DD)
│   ├── 001-setup-inicial.md     # Un .md por entrada; numeración correlativa global
│   ├── 002-modelo-usuario.md    # Si un día es muy largo -> varios .md
│   ├── 003-fix-migracion.md
│   └── DECISIONES.md            # Decisiones de arquitectura/producto tomadas ese día
└── 2026-07-19/
    ├── 004-...
    └── DECISIONES.md
```

## Reglas

1. **Numeración correlativa global**: los devlogs se numeran `001`, `002`, `003`… a lo
   largo de TODA la vida del proyecto, no se reinicia cada día. El nombre del archivo es
   `NNN-slug-corto.md`.
2. **Un `.md` por día** como mínimo. Si el día produce mucho, se parte en varios `.md`
   (cada uno con su número correlativo).
3. **`DECISIONES.md` por día**: registra decisiones (por qué se eligió X sobre Y),
   con el número de devlog al que pertenece cada decisión.
4. **Cada commit** debe quedar referenciado en un devlog (hash + mensaje).
5. **"Número de devlog que mejora"**: si una entrada corrige/mejora una anterior, se
   indica en el campo `Mejora a:` con el número de la entrada previa. Así queda la
   trazabilidad de qué evolucionó.
6. `INDEX.md` se actualiza en cada entrada nueva (tabla: nº, fecha, título, tipo, mejora-a, tarea).
7. **Campo `Tarea:`**: id de la tarjeta de `plan/PLAN.md` que cierra la entrada (`F1-T2`, `X-T1`)
   o `—` si no hay plan o la entrada no corresponde a una tarjeta.

## Plantilla de entrada (`NNN-slug.md`)

```markdown
# NNN — <título>

- **Fecha/hora:** 2026-07-18 14:32
- **Tipo:** feature | fix | refactor | infra | docs | decisión
- **Mejora a:** — (o el nº de devlog previo que este mejora/corrige)
- **Tarea:** <F1-T2 | X-T1 | —>
- **Stack:** laravel

## Qué se hizo
- Paso 1…
- Paso 2…

## Commits
- `a1b2c3d` feat: agrega modelo User con soft-deletes

## Decisiones (resumen; el detalle va en DECISIONES.md)
- Se usó soft-delete en vez de borrado físico (ver DECISIONES.md#dev-002)

## Verificación
- Cómo se comprobó que funciona (comando, salida, screenshot…)

## Próximos pasos
- …
```

## Plantilla `DECISIONES.md`

```markdown
# Decisiones — 2026-07-18

## dev-002 — Soft-delete en usuarios
- **Contexto:** requisito de auditoría.
- **Opciones:** borrado físico vs soft-delete.
- **Elección:** soft-delete (`deleted_at`).
- **Motivo:** recuperabilidad + cumplimiento.
- **Consecuencias:** todas las queries deben respetar el scope.
```

## Regla para el agente
- Antes de dar por terminada una tarea o de hacer un commit, **crea o actualiza la
  entrada de devlog del día** y el `INDEX.md`.
- Si no existe la carpeta del día, créala.
- Nunca inventes la fecha: usa la fecha real del sistema.


---

# Flujo de Git

# Flujo de Git (común a todos los stacks)

## Ramas
- Nunca commitear directo en `main`/`master`/`develop`. Si estoy ahí, creo rama:
  `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`, `chore/<slug>`.

## Commits
- Conventional Commits: `tipo(scope): descripción` en minúscula, imperativo.
  Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`.
- Commits pequeños y atómicos. Un motivo por commit.
- **Sin líneas de co-autor** (`Co-Authored-By`). No añadir firmas de agente.
- Cada commit debe quedar reflejado en el `devlog/` del día (hash + mensaje).

## Push
- **PROHIBIDO** hacer `git push` sin aprobación explícita en el momento (ver prohibited-actions.md).
- Cuando el humano apruebe el push, hacerlo solo a la rama de trabajo, nunca `--force`.

## Antes de commitear
1. Correr linter + type-check + tests del stack.
2. Actualizar `devlog/` (entrada del día + INDEX.md).
3. Revisar el diff (`git diff --staged`) y describirlo en el mensaje.

## Mensajes
- Cuerpo opcional explicando el "por qué", no el "qué" (el qué está en el diff).


---

# Stack: Astro

> Prompt EVOLUTIVO: ajústalo a medida que avanza el proyecto.

Trabajas en un proyecto Astro. Reglas base + estas.

## Convenciones
- Islands architecture: **HTML estático por defecto**, JS solo en islas con `client:*`
  (`client:load`, `client:visible`, `client:idle`). Usa la directiva más perezosa posible.
- Componentes `.astro` para estructura; frameworks (React/Vue/Svelte) solo en islas interactivas.
- Content Collections (`src/content/`) con esquemas `zod` para contenido tipado.
- TypeScript estricto. `astro check` sin errores.

## Rendimiento (la razón de usar Astro)
- Minimiza el JS enviado. No hidrates lo que no necesita interactividad.
- Imágenes con `astro:assets` (`<Image />`). Prefetch para navegación.

## Datos
- Fetch en build (SSG) o en endpoints/SSR según el `output` configurado.
- Endpoints en `src/pages/**/*.ts` para APIs; valida entrada.

## Antes de commitear
1. `npx astro check` 2. `npm run lint` 3. `npm run build` 4. actualizar `devlog/`.

## Front y diseño
- Este stack tiene **perfil de front**: antes de crear o editar UI aplica la skill `ui-ux-pro-max` y el
  `design-system/*/MASTER.md` del proyecto (ver bloque "Front y diseño" más abajo, generado por dev-standards).
- Animación/3D solo con sus skills instaladas (`gsap-scrolltrigger`, `threejs-webgl`, …); si no lo están, pídelo.

## Plan y tareas
- Antes de una feature o proyecto: `plan/PLAN.md` (skill `project-planner`); una tarea `doing` a la vez.
- El cuerpo del commit lleva `Tarea: <id>` y la tarjeta se marca `done` con el enlace al devlog.


---

# Mejores prácticas del stack

# Mejores prácticas — Astro

## Islands
- Envía el mínimo JS. Directiva de hidratación más perezosa que funcione (`client:visible` > `client:idle` > `client:load`).
- Componentes `.astro` (cero JS) para todo lo no interactivo.

## Contenido
- Content Collections con esquema `zod`; `getCollection()` tipado. Nada de frontmatter sin validar.
- Markdown/MDX para contenido; layouts reutilizables.

## Assets / rendimiento
- `astro:assets` para optimizar imágenes. Fuentes locales. CSS con scope por componente.
- View Transitions para navegación fluida si aplica.

## Datos / SSR
- Elige `output` (`static` | `server` | `hybrid`) según necesidad; no fuerces SSR sin motivo.
- Endpoints tipados; validación de entrada.

## Calidad
- `astro check` (typecheck + a11y básica). ESLint/Prettier del repo.

> Detalle y ejemplos bajo demanda: skill `code-quality` → `references/astro.md` (+ `testing.md`, `security-owasp.md`, `performance.md`, `api-design.md`).


---

# Prohibiciones del stack

# Prohibiciones específicas — Astro

Además de las globales (`core/methodology/prohibited-actions.md`):

- Hidratar todo con `client:load` "por si acaso" (rompe el propósito de Astro).
- Meter frameworks pesados como isla cuando un componente `.astro` estático bastaría.
- Exponer secretos: variables de servidor en código que llega al cliente.
- Saltarse `astro check` para que "pase" el build.

---

# Planificación y calidad

**Plan del proyecto:** si existe `plan/PLAN.md`, es la fuente de verdad de qué se hace ahora: elige la tarea `doing` o la primera `todo` y sigue su tarjeta (skill + sección, hecho cuando, verificar). Si no existe y la petición es un proyecto o feature (no un arreglo puntual), crea el plan con la skill `project-planner` antes de codificar.

**Protocolo de carga de contexto:** lee una sola skill por tarea (dos si cruza UI + lógica) y, dentro, solo la sección o referencia
que indique su tabla "Lectura mínima por tarea". `SKILL.upstream.md` y `references/` se leen por secciones (Read con offset/limit o Grep),
nunca enteros. No releas lo ya leído. Si la skill necesaria no está instalada, dilo y propón instalarla; no improvises esa librería.

| Si la tarea implica… | Lee antes |
|---|---|
| Arrancar un proyecto o feature, planificar, "¿qué hacemos ahora?", siguiente tarea; y SIEMPRE que exista plan/PLAN.md (se sigue el plan) | `.claude/skills/project-planner/SKILL.md` |
| Auditar backend y arquitectura con pruebas (herramientas por stack, evidencia por hallazgo, informe), deuda técnica, código legado, dependencias circulares y refactor seguro con tests de caracterización | `.claude/skills/backend-audit/SKILL.md` |
| Desplegar y operar en producción cualquier stack: Netlify/Vercel/Forge/VPS, Docker, CI/CD con GitHub Actions, secretos por entorno, colas y cron en prod, backups con restore probado, monitorización e incidentes | `.claude/skills/deploy-ops/SKILL.md` |
| Maquetar o arreglar emails HTML (transaccionales y newsletters): react-email/MJML/plantillas del framework, compatibilidad Gmail/Outlook, dark mode, texto plano y pruebas antes de enviar | `.claude/skills/email-html/SKILL.md` |
| Empezar una tarea de UI, animación o 3D: detecta el perfil de front y la lectura mínima por tarea; efectos concretos del catálogo (79 recetas: CSS moderno, formas y SVG, tipografía cinética, microinteracciones, WebGL avanzado) | `.claude/skills/front-activation/SKILL.md` |
| Posicionar y medir la web: SEO on-page y local, keywords, Search Console, GA4, Google Tag Manager (contenedor, dataLayer, Consent Mode) y MCPs de analítica para operar con agentes | `.claude/skills/marketing-seo/SKILL.md` |
| Escribir o refactorizar lógica, crear tests, manejar errores/logs, seguridad, rendimiento, diseñar endpoints/APIs, revisar o abrir un PR | `.claude/skills/code-quality/SKILL.md` |
| Terminar un paso relevante o commitear (siempre) | `.claude/skills/devlog/SKILL.md` |
| Empezar cualquier tarea no trivial: decide qué skill y sección leer (tabla de activación + protocolo de carga) | `.claude/skills/skill-router/SKILL.md` |

Para dominios complejos (reglas de negocio ricas, varios contextos) existe la skill opcional `ddd-hexagonal`: pídeme instalarla con `sync.ps1 -Bundle architecture`.

---

# Front y diseño (perfil: Astro + React islands + Tailwind)

Este proyecto es de **Astro + React islands + Tailwind**. Para cualquier trabajo de UI se aplica la skill `ui-ux-pro-max` con estos stacks del
buscador, en este orden de prioridad: `astro`, `react`, `shadcn`, `html-tailwind`.

**Antes de crear o editar UI** (páginas, componentes, estilos, layouts, formularios):
1. Lee `.claude/skills/ui-ux-pro-max/SKILL.md` (flujo, perfiles y reglas duras) si aún no lo has hecho en esta sesión; solo su tabla de lectura mínima te dirá qué referencia abrir.
2. Si existe `design-system/*/MASTER.md`, es la fuente de verdad de estilo, color y tipografía. Si no existe, genéralo (y si hay plan, es la primera tarjeta de UI):
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<producto industria keywords>" --design-system -p "<Proyecto>" --persist -o .
   # Windows: py -3 .claude/skills/ui-ux-pro-max/scripts/search.py ...
   ```
3. Guías del stack: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<tema>" --stack astro` (y el resto de stacks del perfil si aplica).
4. Antes de entregar, pasa el checklist de `references/pro-rules.md` (contraste, teclado, 375/768/1440 px, estados, reduced-motion, sin emojis como iconos).

## Activación de skills de front (lee el SKILL.md indicado ANTES de actuar)

| Si la tarea implica… | Skill |
|---|---|
| Crear, maquetar o rediseñar páginas, vistas, layouts, componentes, formularios, dashboards, temas, colores, tipografía, iconos, responsive, accesibilidad; archivos .vue .tsx .jsx .astro .blade.php .html .css | `.claude/skills/ui-ux-pro-max/SKILL.md` |
| Animación declarativa en React/Next con Motion (variants, gestos, layout animations) | `.claude/skills/motion-framer/SKILL.md` |
| 3D declarativo en React/Next (R3F + drei) | `.claude/skills/react-three-fiber/SKILL.md` |
| Generar imágenes IA acordes a la web: producto flotante, heros, fondos, 3D, mockups, texturas (gpt-image en Codex, Nano Banana en Antigravity, script multi-proveedor) | `.claude/skills/image-gen/SKILL.md` |
| Verificar una UI terminada en navegador real: responsive 375/768/1440, dark mode, consola y accesibilidad (axe); obligatoria antes de dar una vista por hecha | `.claude/skills/ui-verify/SKILL.md` |
| 3D con Babylon.js (juegos, escenas complejas) | `.claude/skills/babylonjs-engine/SKILL.md` |
| Animación, scroll-driven, parallax, pin/scrub, timelines, transiciones de página, smooth scroll (Lenis) | `.claude/skills/gsap-scrolltrigger/SKILL.md` |
| 3D, WebGL/WebGPU, modelos GLB/GLTF, shaders, partículas, configuradores, heros 3D | `.claude/skills/threejs-webgl/SKILL.md` |

---

# Sesión y comandos del proyecto

**Al iniciar cada sesión** (si no hay hooks que lo hagan por ti, hazlo tú): ejecuta y lee `git status -sb`, `git log --oneline -5`,
la cabecera y la fase activa de `plan/PLAN.md` (si existe) y `devlog/<hoy>/` + última entrada de `devlog/INDEX.md`. No commitees en `main`/`master`/`develop`.
**Al cerrar**: tarea del plan actualizada (`done` con enlace al devlog), devlog del día escrito, siguiente tarea propuesta.

**Comandos del stack** (úsalos para verificar antes de decir "hecho" y pega su salida):

| Acción | Comando |
|---|---|
| lint | `npm run lint` |
| types | `npx astro check` |
| build | `npm run build` |
| dev | `npm run dev` |

---

# Skills disponibles en este proyecto

Cada skill es una carpeta con `SKILL.md` (instrucciones), `references/`, `scripts/` y `templates/`.
Cuando la tarea encaje con la descripción, **lee su `SKILL.md` completo antes de actuar** y sigue su flujo. En Codex puedes invocarla explícitamente con `$<nombre>`.

- **devlog** (`.claude/skills/devlog/SKILL.md`): Crea o actualiza la entrada de devlog del día y el INDEX.md antes de cerrar una tarea o hacer un commit. Úsalo siempre que termines un paso relevante, corrijas algo o vayas a commitear.
- **project-planner** (`.claude/skills/project-planner/SKILL.md`): Planificador, ÚSALO PRIMERO al arrancar un proyecto o feature: crea plan/PLAN.md (fases entregables, tareas con skill y sección, hecho cuando, verificación) y lo hace seguir tarea a tarea. También ...
- **code-quality** (`.claude/skills/code-quality/SKILL.md`): Buenas prácticas de código (Laravel/PHP, TypeScript, React/Next, Vue, Astro, Python): tipado, tests, errores/logs, seguridad, rendimiento, APIs, PR. Úsala al escribir o refactorizar lógica, testear...
- **backend-audit** (`.claude/skills/backend-audit/SKILL.md`): Auditoría de backend y arquitectura con PRUEBAS: herramientas reales por stack, cada hallazgo con evidencia (salida, archivo:línea, test que falla), informe y plan de refactor seguro. Úsala para au...
- **skill-router** (`.claude/skills/skill-router/SKILL.md`): ÚSAME PRIMERO en cualquier tarea no trivial: árbol de decisión que dice qué skill y sección leer (UI: ui-ux-pro-max; animación, 3D, calidad, arquitectura DDD, devlog) y detecta el stack. Puerta de ...
- **deploy-ops** (`.claude/skills/deploy-ops/SKILL.md`): Despliegue y operaciones para TODOS los stacks: deploy por plataforma (Netlify/Vercel/Forge/VPS), Docker, CI/CD con GitHub Actions, secretos por entorno, colas y cron en prod, backups con restore p...
- **front-activation** (`.claude/skills/front-activation/SKILL.md`): ÚSAME PRIMERO en tareas de front: detecta el stack (Laravel+Inertia+Vue, Next, Astro, Vue) y aplica el árbol de front: 1º ui-ux-pro-max (design system y patrón), luego el efecto (catálogo de efecto...
- **ui-ux-pro-max** (`.claude/skills/ui-ux-pro-max/SKILL.md`): SKILL POR DEFECTO de front: ante cualquier landing, página, web, hero, componente, formulario, dashboard, tema o rediseño úsala PRIMERO (elige estilo, paleta, tipografía y patrón; design system por...
- **ui-verify** (`.claude/skills/ui-verify/SKILL.md`): Verificación OBLIGATORIA de UI antes de dar una vista por hecha: script Playwright (scripts/verify-ui.mjs) o navegador Chrome MCP en 375/768/1440, MÓVIL PRIMERO, dark mode, consola y accesibilidad....
- **image-gen** (`.claude/skills/image-gen/SKILL.md`): Generar imágenes IA coherentes con la web: producto flotando, heros, fondos, 3D, mockups. PRIMERO la generación nativa del host (app de ChatGPT/Codex, Antigravity); scripts/generate.mjs por API sol...
- **marketing-seo** (`.claude/skills/marketing-seo/SKILL.md`): Marketing de la web: SEO on-page y local, GA4 + Tag Manager (contenedores, dataLayer, Consent Mode) y MCPs de analítica para operar con agentes (GA4 oficial, Search Console, PostHog). Úsala para po...
- **email-html** (`.claude/skills/email-html/SKILL.md`): Emails HTML que se ven bien en Gmail/Outlook/Apple Mail: transaccionales y newsletters con react-email/MJML o plantillas del framework, dark mode, texto plano y pruebas antes de enviar. Úsala al ma...
- **threejs-webgl** (`.claude/skills/threejs-webgl/SKILL.md`): 3D/WebGL con Three.js: modelos GLB, heros 3D, configuradores, partículas, shaders, scroll 3D. TresJS (Vue/Inertia), R3F (Next), vanilla (Astro); assets, rendimiento móvil, dispose, fallback. No par...
- **gsap-scrolltrigger** (`.claude/skills/gsap-scrolltrigger/SKILL.md`): Animación web con GSAP 3 + ScrollTrigger + Lenis: entradas al hacer scroll, pin/scrub, parallax, scroll horizontal, reveals, transiciones de página, sincronía con 3D. Vue/Inertia, Next, Astro, vani...
- **react-three-fiber** (`.claude/skills/react-three-fiber/SKILL.md`): 3D declarativo en React con React Three Fiber + drei: Canvas, useFrame, useGLTF, Environment, ScrollControls. ÚSALA en Next.js/React para heros 3D, configuradores, escenas. No para Vue (TresJS en t...
- **motion-framer** (`.claude/skills/motion-framer/SKILL.md`): Animación en React con Motion (ex Framer Motion): variants, gestos, layout, AnimatePresence, springs, useScroll. ÚSALA en Next.js/React y en Astro dentro de una island React. No para Vue ni scroll ...
- **babylonjs-engine** (`.claude/skills/babylonjs-engine/SKILL.md`): Motor 3D Babylon.js 7: escenas WebGL/WebGPU, cámaras, luces, PBR, glTF, física Havok, sombras, GUI, WebXR, juegos en navegador. Disparadores: Babylon, @babylonjs/core, Havok. No para Three.js/R3F n...
