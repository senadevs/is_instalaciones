# 013 — Actualización a Senzu y migración a senzu/

- **Fecha/hora:** 2026-10-10
- **Tipo:** infra
- **Mejora a:** 003
- **Tarea:** —
- **Stack:** astro

## Qué se hizo
- Plugin `senzu-all` instalado y lanzado `/instalar` para pasar a la instalación completa por proyecto.
- Paquete usado: `D:/dev-standards` (copia local). `git pull --ff-only` falló porque la rama `fix/plan-al-arrancar` no sigue a ninguna remota: se instaló con lo local.
- Ejecutado `node D:/dev-standards/tools/init.mjs --stack astro --path <proyecto> --tools claude`, respetando la selección guardada (bundle `core-3d-animation`).
- El instalador movió con `git mv` (historial conservado): `devlog/`, `plan/`, `design-system/`, `conventions.md/.json` → `senzu/`; `.dev-standards.json` → `senzu/senzu.json`.
- Skills: devlog, project-planner, code-quality, backend-audit, depurar, skill-router, instalar-proyecto, deploy-ops, front-activation, ui-ux-pro-max, ui-verify, image-gen, marketing-seo, email-html, threejs-webgl, gsap-scrolltrigger, react-three-fiber, motion-framer, babylonjs-engine.
- Comandos nuevos: `/depurar`, `/entregar`, `/estimar`, `/mapa`, `/recordar`, `/retomar`, `/ronda`. Hooks nuevos: arquitectura-guard, arranque-guard, backend-guard, back-skill-reminder, cierre-limpio, entre otros.
- `CLAUDE.md` regenerado; sigue importando `CLAUDE.project.md` (sin tocar).

## Commits
- `8a34c0b` chore(senzu): actualizar instalacion y migrar a senzu/

## Decisiones (resumen)
- Actualizar con la selección guardada en vez de reinstalar «Todo» (elección del usuario).
- La política de push pasa a D-042 de Senzu: push permitido a ramas de trabajo, bloqueado a principales.

## Verificación
- Salida del instalador: `Listo. Config regenerada.`
- `git status --short`: 26 renombrados (R), 189 modificados, 37 nuevos; `ls senzu` → conventions.*, design-system, devlog, plan, senzu.json.
- `grep` de rutas antiguas en `CLAUDE.project.md` y `README.md`: sin coincidencias.

## Próximos pasos
- Sesión reiniciada; `npx astro check` 0 errores y `npm run build` Complete! antes del commit.
- Actualizar en MEMORIA.md las rutas antiguas (devlog/, plan/, design-system/) a senzu/.
- Dar upstream a la rama de `D:/dev-standards` (o volver a `main`) para que `/instalar` pueda actualizarse.
