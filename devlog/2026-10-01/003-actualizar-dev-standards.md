# 003 — Actualización de dev-standards y recuperación de la guía propia

- **Fecha/hora:** 2026-10-01
- **Tipo:** infra
- **Mejora a:** 001
- **Tarea:** —
- **Stack:** astro

## Qué se hizo
- Paquete localizado en `~/.dev-standards` (commit `2e4c8d3`, ya al día con `git pull --ff-only`).
- Recuperada la guía propia original (`git show HEAD:CLAUDE.MD`) en `CLAUDE.project.md`: la instalación previa la había sobrescrito sin respaldo.
- Ejecutado `node ~/.dev-standards/tools/init.mjs --stack astro --path <proyecto> --tools claude` (selección «Todo»).
- Resultado: 17 skills, 13 hooks (guard, secrets-guard, protect-files, conventions-guard, stop-guard…), 15 comandos; `CLAUDE.md` regenerado con `@CLAUDE.project.md` en la cabecera.

## Commits
- `b88b149` chore(dev-standards): instalar dev-standards y conservar la guia propia (rama `chore/adoptar-convenciones`)

## Decisiones (resumen; el detalle va en DECISIONES.md)
- Respaldar e importar la guía propia en vez de descartarla (ver DECISIONES.md#dev-003).

## Verificación
- Salida del instalador: `Listo. Config regenerada.`
- `ls .claude/hooks .claude/commands` muestra los 13 hooks y 15 comandos; `head -1 CLAUDE.MD` → `@CLAUDE.project.md`.

## Próximos pasos
- Abrir una sesión nueva para cargar la configuración.
- Lanzar `/adoptar` para sellar las convenciones del proyecto.
- Crear rama `chore/dev-standards` y commitear la instalación.
