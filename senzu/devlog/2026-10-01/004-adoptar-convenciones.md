# 004 — Convenciones del proyecto adoptadas y selladas (/adoptar)

- **Fecha/hora:** 2026-10-01 10:54
- **Tipo:** decisión
- **Mejora a:** 003
- **Tarea:** —
- **Stack:** astro

## Qué se hizo
- Análisis con evidencia (~30 archivos: `tsconfig`, `astro.config.mjs`, `package.json`, estimador, componentes Astro/React, `api/*.ts`, tests Vitest y `git log -30`).
- Entrevista de 4 puntos ambiguos (idioma, JS vs TS, imágenes, commits).
- Creados y sellados (`dev-standards:inmutable`) en la raíz:
  - `conventions.md`: naming, estructura, backend, front, tests, git, zonas intocables y pendientes.
  - `conventions.json`: 8 reglas ejecutables para `conventions-guard` (console.log, alias `@/`, `process.env`, hex arbitrarios, GSAP solo vía `lib/gsap.ts`, `<img>` en `.astro`, tests fuera de `*.test.js`, pureza de los módulos de lógica del estimador).
- Paso 3b (arquitectura): sin Deptrac/dependency-cruiser (solo 2 endpoints); la frontera real (lógica pura del estimador vs UI React/Three) queda cubierta por la regla 8.

## Commits
- Rama `chore/adoptar-convenciones`, creada desde `main` para commitear el trabajo pendiente:
  - `b88b149` chore(dev-standards): instalar dev-standards y conservar la guia propia (devlog 001, 003)
  - `74b030d` feat(escombros): landing de retirada de escombros con efectos GSAP (devlog 002, tarea F1)
  - docs(convenciones): adoptar y sellar las convenciones del proyecto (este commit; incluye esta entrada)
- `tmp_live_estimador.html` queda fuera (volcado temporal, sin versionar).

## Decisiones (resumen; el detalle va en DECISIONES.md)
- Idioma mixto, JS solo en `estimator/`, `astro:assets` para imágenes nuevas, Conventional Commits en español (ver DECISIONES.md#dev-004).

## Verificación
- Script Node que aplica cada regla a todo `src/`: reglas 2, 3, 4, 5, 7 y 8 con 0 coincidencias; regla 1 con 1 coincidencia preexistente (`CTAReviews.astro:88`, un `console.log(response)` olvidado); regla 6 con 31 `<img>` preexistentes (esperado). El hook solo bloquea lo nuevo.
- `verify-build.mjs`: types PASS (`astro check`), build PASS, lint SKIP (no configurado). `npm test`: 3 archivos, 11 tests en verde.
- Casos sintéticos: `gsap` importado en un componente → bloquea; en `src/lib/gsap.ts` → permitido; `<Image />` → permitido; `<img>` → bloquea; `react`/`three` en `geometry.js`/`export/model.js` → bloquea; `bg-[#ff0000]` → bloquea; `vitest` en `.test.ts` → bloquea; en `.test.js` → permitido.

## Próximos pasos
- Decidir linter (no existe `npm run lint`).
- Planificar la migración de las 31 `<img>` a `astro:assets`.
- Quitar el `console.log(response)` de `CTAReviews.astro:88`.
