# 022 — El agente del chat no respondía: modelo retirado por NVIDIA

- **Fecha/hora:** 2026-10-10
- **Tipo:** fix
- **Mejora a:** —
- **Tarea:** X-T7
- **Stack:** astro

## Reproducir y causa
- `POST /api/chat` en local → `HTTP 500 {"error":"410 status code (no body)"}`; log: `Chat API error: 410 status code (no body)`. **410 Gone**: NVIDIA retiró `meta/llama-3.1-8b-instruct`.
- Corrección de la hipótesis de la tarjeta (017): el chat no usa OpenRouter sino la API de NVIDIA (`integrate.api.nvidia.com`) con el SDK de OpenAI; el id era válido, el modelo ya no existe.
- Catálogo `/v1/models` (80 modelos) probado de verdad con el prompt del bot: `gemma-3-12b-it`, `mistral-nemo-12b-instruct` y `mistral-7b-instruct-v0.3` → 404 aunque aparecen en el listado; `gemma-4-31b-it` sin respuesta en minutos; `nemotron-3.5-lightning-30b-a3b` mete su razonamiento en la respuesta; **`openai/gpt-oss-20b` → OK** (respuesta correcta, breve y en español). Con `reasoning_effort: 'low'` el primer token baja de 3-6 s a ~1 s.

## Qué se hizo (`src/pages/api/chat.ts`)
- Modelo por defecto `openai/gpt-oss-20b` con `reasoning_effort: 'low'`; `NVIDIA_CHAT_MODEL` (lista por comas) permite cambiarlo sin tocar código.
- Respaldo: si un modelo da 404/410 o se agota el tiempo, se prueba el siguiente de la lista (`console.error` con el motivo).
- Cliente OpenAI con `timeout: 20000` y `maxRetries: 1` (un modelo colgado ya no deja al usuario esperando sin fin).
- Si el stream llega vacío o se corta sin texto, se envía un mensaje amable con el teléfono y WhatsApp (antes la burbuja quedaba en blanco). Solo se reenvía `delta.content`: el razonamiento de gpt-oss va aparte.
- El 500 ya no expone al navegador el texto del proveedor (queda en el log).
- `.env.example` nuevo con los nombres de las variables (`NVIDIA_API_KEY`, `NVIDIA_CHAT_MODEL`, `GOOGLE_API_KEY`, `GOOGLE_PLACE_ID`), sin valores.

## Commits
- `3abca49` fix(chat): modelo vigente de nvidia con respaldo y respuesta amable

## Verificación
- Con `NVIDIA_CHAT_MODEL="meta/llama-3.1-8b-instruct,openai/gpt-oss-20b"`: log `Chat: modelo meta/llama-3.1-8b-instruct no disponible (410); probando el siguiente` y respuesta 200.
- Respuestas (HTTP 200, primer byte 0,8-1,7 s): «Sí, hacemos boletines eléctricos y cubrimos Badalona… [[GOTO:/#contacto]]»; «Te llevo a contacto 👇 [[GOTO:/contacto]]»; «Sí, abrimos los sábados de 9:00 a 14:00.» Modo inmersivo con el modelo por defecto: escena `[[SHOW:scene|theme=reformas|…]]` en 0,8 s.
- Clave inválida (`NVIDIA_API_KEY=clave-invalida-de-prueba`): 500 y en el navegador «Lo siento, ha ocurrido un error. Puedes contactarnos directamente al 637 59 17 36 o por WhatsApp.»
- Playwright en 375 y 1440 (abrir chat, escribir, Enter): «Sí, instalamos aire acondicionado en Cornellà…» y navega a Climatización; 0 errores JS. Capturas en `senzu/ui-verify/x-t7/`.
- `verify-build`: types PASS, build PASS (lint no configurado); `npm test` 11/11.

## Próximos pasos
- En producción el chat sigue roto hasta desplegar (X-T9: desplegar sin /escombros). En Netlify no hace falta variable nueva; `NVIDIA_CHAT_MODEL` es opcional.
