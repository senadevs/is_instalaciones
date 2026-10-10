# 012 — Verificación de UI de la sesión y memoria del proyecto

- **Fecha/hora:** 2026-10-01 15:20
- **Tipo:** docs
- **Mejora a:** —
- **Tarea:** —
- **Stack:** astro

## Qué se hizo
- `verify-build.mjs`: lint SKIP (no configurado), types PASS, build PASS.
- `verify-ui.mjs` (375 → 768 → 1440) en las páginas tocadas hoy. Resultados:
  | Página | Problemas | Principales |
  |---|---|---|
  | `/` | 15 | scroll horizontal por la cinta `.cta-ticker` (F3-T4); 21 img sin dimensiones (F4-T5); 11 tap targets < 44 px; labels del formulario del hero "desbordan"; 5 campos sin label (F4) |
  | `/escombros` | 7 | 1 img sin dimensiones; tap targets del footer; `#chat-toggle` desborda |
  | `/estimador` | 13 | controles del panel de 27-36 px y papeleras de 14 px (móvil del planificador, punto 8); texto < 12 px en el panel |
  | `/nosotros` | 14 | scroll horizontal por el slider `GlitchSlider` (F4-T2); 20 img sin dimensiones |
  | `/servicios/reformas-integrales` | 17 | scroll horizontal por `.cta-service-card`; **2 h1** (F6-T2); 6 img sin dimensiones |
- Comprobado que **no vienen de los cambios de hoy**: con la fuente antigua el header a 768 px desbordaba aún más (855 px vs 813 px) y el scroll total era el mismo (14 px). Los errores de consola del planificador (`504 Outdated Optimize Dep`) desaparecen reiniciando el dev server con `--force` (entorno, no código).
- No se corrigen aquí: son de toda la web y están en las tarjetas F3-T4, F4, F5 y F6. Se deja constancia para atacarlos en su tarea.
- `devlog/MEMORIA.md` creada desde el historial (§4 de la referencia): 8 decisiones vigentes (D-001…D-008), reglas del cliente, lo que no funcionó y pendientes. Pendiente de que el cliente la confirme.
- `.gitignore`: `__pycache__/` (lo genera el buscador de `ui-ux-pro-max`).

## Commits
- docs(devlog): memoria del proyecto y verificacion de ui (este commit)

## Verificación
- Salidas de `verify-build.mjs` y `verify-ui.mjs` resumidas arriba; capturas en el scratchpad de la sesión.

## Próximos pasos
- Respuesta del cliente: X-T4 (Escombrocero), móvil del planificador, cifras del contador, accesos GTM/GA4.
