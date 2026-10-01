# Decisiones — 2026-10-01

## dev-003 — Recuperar la guía propia como CLAUDE.project.md
- **Contexto:** el `CLAUDE.MD` versionado (análisis arquitectónico) fue sobrescrito por una instalación anterior de dev-standards sin respaldo.
- **Opciones:** sobrescribir sin más vs recuperarlo de git e importarlo.
- **Elección:** recuperarlo de `HEAD` a `CLAUDE.project.md`, importado desde el `CLAUDE.md` generado.
- **Motivo:** conservar el conocimiento específico del proyecto; el instalador lo referencia y da prioridad a sus reglas.
- **Consecuencias:** las reglas propias van en `CLAUDE.project.md`; `CLAUDE.md` no se edita a mano.

## dev-004 — Convenciones adoptadas con /adoptar
- **Contexto:** proyecto existente (94 commits) sin convenciones selladas; estilo mixto en idioma, lenguaje y manejo de imágenes.
- **Opciones:** imponer el estilo de dev-standards vs sellar el estilo real del proyecto.
- **Elección:** sellar el estilo real con 4 decisiones del usuario: idioma mixto (técnico EN, dominio ES, comentarios ES); `components/estimator/` en JS y lo nuevo fuera en TS; **imágenes nuevas con `astro:assets`** (cambio respecto al `<img>` actual); Conventional Commits en español con scope.
- **Motivo:** código nuevo indistinguible del existente; `astro:assets` por rendimiento (mejor práctica de Astro).
- **Consecuencias:** `conventions-guard` bloquea las violaciones nuevas; cambiar convenciones = borrar `conventions.md`/`.json` y re-ejecutar `/adoptar`. Las 31 `<img>` existentes quedan como deuda a migrar.
