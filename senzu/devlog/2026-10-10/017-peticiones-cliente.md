# 017 — Peticiones del usuario: sin mencionar el local, móvil, agente, /escombros y llms.txt

- **Fecha/hora:** 2026-10-10
- **Tipo:** decisión
- **Mejora a:** 016
- **Tarea:** —
- **Stack:** astro

## Qué se hizo
- `public/llm.txt` y `public/llms.txt`: fuera «negocio de zona de servicio, sin local abierto al público» y «trabajamos a domicilio» (el usuario: resta prestigio). El schema sigue sin publicar dirección (D-011), sin decirlo.
- Plan: nuevas tarjetas X-T5 (chat en móvil), X-T6 (cookies en móvil), X-T7 (el agente del chat no responde; `MODEL = 'meta/llama-3.1-8b-instruct'` no tiene formato de id de OpenRouter), X-T8 (`llms.txt` con buenas prácticas), X-T9 (desplegar sin /escombros).
- Memoria: dos reglas del cliente nuevas y los pendientes.

## Commits
- `1a49cac` docs(plan): peticiones del usuario y llms sin mencionar el local

## Decisiones (resumen)
- /escombros no sube a producción hasta que el cliente lo apruebe (X-T9 decide el mecanismo con el usuario).
- `llms.txt`: Google no lo usa para posicionar; se mejora para otros asistentes de IA y por coherencia (anotado en X-T8).

## Verificación
- `grep -n 'local abierto' public/llm*.txt` → sin resultados.

## Próximos pasos
- F6-T4 (imágenes sociales y favicons), después X-T5…X-T9.
