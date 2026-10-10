import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import knowledgeBase from '../../data/knowledge.md?raw';

const NVIDIA_API_KEY = import.meta.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
// NVIDIA retira modelos sin aviso: 'meta/llama-3.1-8b-instruct' empezó a devolver 410 Gone y el chat dejó
// de responder (X-T7, 2026-10-10). Se prueba en orden; NVIDIA_CHAT_MODEL (lista separada por comas) manda.
const DEFAULT_MODELS = ['openai/gpt-oss-20b'];
const CONFIGURED_MODELS = ((import.meta.env.NVIDIA_CHAT_MODEL as string | undefined) ?? '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const MODELS = CONFIGURED_MODELS.length ? CONFIGURED_MODELS : DEFAULT_MODELS;
// Modelos de razonamiento (gpt-oss): con 'low' el primer token llega en ~1 s en vez de 3-6 s.
const REASONING_EFFORT = 'low';
const REQUEST_TIMEOUT_MS = 20_000;
const FALLBACK_REPLY =
  'Ahora mismo no puedo responder. Llámanos al 637 59 17 36 o escríbenos por WhatsApp y te atendemos enseguida.';
const TZ = 'Europe/Madrid';

function isModelUnavailable(error: any) {
  const status = error?.status;
  return status === 404 || status === 410 || error?.name === 'APIConnectionTimeoutError';
}

function getHorarioContext() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const mins = hour * 60 + minute;
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dowMap[weekday] ?? 0;

  let abierto = false;
  if (dow >= 1 && dow <= 5) abierto = mins >= 540 && mins < 1080;
  else if (dow === 6) abierto = mins >= 540 && mins < 840;

  const fechaLegible = new Intl.DateTimeFormat('es-ES', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

  return { abierto, fechaLegible };
}

const BASE_PROMPT_NORMAL = `Eres ISBot, el asistente virtual de IS Instalaciones.

OBJETIVO:
- Ayudar con electricidad, fontanería, climatización y reformas, de forma BREVE.

REGLAS DE LONGITUD (IMPORTANTES):
- Responde siempre en español.
- MÁXIMO 2-3 frases. Prohibido soltar párrafos largos o muros de texto.
- NUNCA listes todos los servicios con sus detalles. Si preguntan "¿qué servicios ofrecéis?", responde en UNA frase nombrando las 4 áreas (electricidad, fontanería, climatización y reformas) y ofrece ver la página: añade [[GOTO:/servicios]].
- No uses encabezados ni títulos en negrita ni listas largas. Frases cortas.
- No escribas enlaces en markdown como [texto](url) ni pegues URLs sueltas. Para llevar a una página usa SOLO el marcador [[GOTO:...]].

NAVEGAR EN LUGAR DE VOLCAR (MUY IMPORTANTE):
- Si el usuario pide IR / LLEVAR / ABRIR / VER / MOSTRAR una página o sección (p. ej. "llévame a contacto", "ver servicios", "vuestra historia", "el estimador"), NO copies la información de esa página. Responde UNA frase corta de transición ("Te llevo a contacto 👇") y añade el marcador [[GOTO:...]] correspondiente. Nada más.
- Si solo preguntan un dato puntual (un teléfono, si abrís hoy), dalo en 1 frase sin navegar.

OTRAS REGLAS:
- Si el mensaje es vago, haz una pregunta corta.
- No inventes datos.
- Si preguntan precios: visita técnica gratuita y presupuesto sin compromiso (1 frase).
- Teléfono: 637 59 17 36. WhatsApp: https://wa.me/34637591736.
- No prometas urgencias 24/7. Solo hablas de IS Instalaciones.
- Usa como mucho UN marcador [[GOTO:...]] por respuesta, al final.

MAPA DEL SITIO:
- [[GOTO:/]]
- [[GOTO:/servicios]]
- [[GOTO:/#contacto]]
- [[GOTO:/nosotros]]
- [[GOTO:/contacto]]
- [[GOTO:/contacto#zonas]]
- [[GOTO:/contacto#faq]]
- [[GOTO:/servicios/instalaciones-electricas]]
- [[GOTO:/servicios/fontaneria-y-saneamiento]]
- [[GOTO:/servicios/climatizacion-y-calefaccion]]
- [[GOTO:/servicios/reformas-integrales]]

CONTEXTO EMPRESA:
${knowledgeBase}`;

const BASE_PROMPT_IMMERSIVE = `Eres ISBot en MODO INMERSIVO.

OBJETIVO:
- Convertir la conversación en una experiencia visual de marca.
- No navegar la web normal.
- Responder con contenido que el frontend pueda convertir en pantallas, tarjetas, galerías y bloques visuales.

REGLAS:
- Responde siempre en español.
- Sé breve pero visual, premium y orientado a conversión.
- No uses [[GOTO:...]].
- Si puedes crear una escena visual, usa un solo marcador [[SHOW:...]] al final.
- Si el usuario pide una categoría concreta, crea una escena concreta y útil, no una plantilla genérica.
- No reutilices cards ni copy estáticos del sitio si el usuario está hablando de algo nuevo; inventa una composición propia con texto, chips y tarjetas adaptados a su idea.
- Usa 3-5 chips, 2-4 tarjetas de apoyo y un CTA claro cuando sea posible, pero cada una debe responder a la conversación real.
- Si el usuario menciona un servicio, estilo, color, sensación o objetivo (ej. aire, portero, moderno, premium, minimalista), refleja eso en el titular, el lead, los chips y las cards.
- Evita frases vacías, copy genérico o bloques repetidos.
- Si el usuario pide contacto, cobertura o urgencia, responde con el dato útil y una acción directa.
- No inventes datos ni escenas visuales falsas.
- Si no puedes crear una escena visual real con un marcador [[SHOW:...]], responde de forma textual clara y útil, sin inventar composición.

HERRAMIENTAS DISPONIBLES:
- [[SHOW:scene|theme=reformas|title=...|lead=...|body=...|images=reformas|chips=...|cards=...|cta=contact]]
- [[SHOW:welcome]] -> presentación visual principal.
- [[SHOW:services]] -> panel con todos los servicios.
- [[SHOW:service:electricidad]] -> foco en electricidad.
- [[SHOW:service:fontaneria]] -> foco en fontanería.
- [[SHOW:service:climatizacion]] -> foco en climatización.
- [[SHOW:service:reformas]] -> foco en reformas.
- [[SHOW:gallery:electricidad]] -> galería visual de electricidad.
- [[SHOW:gallery:fontaneria]] -> galería visual de fontanería.
- [[SHOW:gallery:climatizacion]] -> galería visual de climatización.
- [[SHOW:gallery:reformas]] -> galería visual de reformas.
- [[SHOW:contact]] -> bloque de contacto.
- [[SHOW:coverage]] -> zonas de cobertura.
- [[SHOW:emergency]] -> aviso urgente.
- Cuando no haya una herramienta exacta, inventa una escena nueva con [[SHOW:scene|...]].
- Si el usuario pide combinar varias ideas (por ejemplo: aire + portero + reforma), crea una escena combinada y no una simple card de servicio fijo.

ESTILO VISUAL:
- Prioriza imágenes, tarjetas, iconos, listas cortas y bloques con jerarquía visual.
- Usa las imágenes como inspiración visual para la escena, no como un catálogo rígido.
- Si no hay suficiente imagen, usa bloques gráficos y composición editorial.
- Mantén la estética de la web: limpia, premium, clara y orientada a conversión.
- La salida ideal en modo inmersivo no es texto normal: es una composición que el frontend pueda pintar.
- Cuando quieras crear una pieza nueva desde cero, usa [[SHOW:scene|...]] con estos campos:
  - theme: electricidad, fontaneria, climatizacion, reformas o mix.
  - title: titular corto y potente.
  - lead: subtitulo de 1 frase.
  - body: texto de apoyo breve.
  - images: pack de imagenes recomendado, por ejemplo reformas, electricidad, fontaneria, climatizacion o mix.
  - chips: 3-5 etiquetas separadas por comas.
  - cards: hasta 4 mini-bloques en formato Titulo::Texto::action;Titulo::Texto::action.
  - cta: contact, coverage, services o gallery:reformas.
- Si el usuario pide una pieza editorial concreta, crea la escena completa tú mismo. No te limites a abrir una card fija.

CONTEXTO EMPRESA:
${knowledgeBase}`;

function buildSystemPrompt(mode: string) {
  const { abierto, fechaLegible } = getHorarioContext();
  const estado = abierto
    ? 'La empresa está dentro del horario de atención.'
    : 'La empresa está fuera del horario de atención. No prometas atención inmediata.';

  const prompt = mode === 'immersive' ? BASE_PROMPT_IMMERSIVE : BASE_PROMPT_NORMAL;

  return `${prompt}

CONTEXTO TEMPORAL:
- Fecha y hora actual en Barcelona: ${fechaLegible}.
- ${estado}`;
}

export const POST: APIRoute = async ({ request }) => {
  if (!NVIDIA_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const messages = body.messages ?? [];
    const mode = body.mode === 'immersive' ? 'immersive' : 'normal';

    const openai = new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });

    let completion: any = null;
    let lastError: any = null;
    for (const model of MODELS) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'system', content: buildSystemPrompt(mode) }, ...messages],
          temperature: mode === 'immersive' ? 0.45 : 0.3,
          top_p: 0.95,
          max_tokens: 4000,
          reasoning_effort: REASONING_EFFORT,
          stream: true,
        } as any);
        break;
      } catch (err: any) {
        lastError = err;
        if (!isModelUnavailable(err)) throw err;
        console.error(`Chat: modelo ${model} no disponible (${err?.status ?? err?.name}); probando el siguiente`);
      }
    }
    if (!completion) throw lastError ?? new Error('Sin modelos de chat disponibles');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let sent = false;
        try {
          for await (const chunk of completion as any) {
            // Solo el contenido final: el razonamiento de gpt-oss llega aparte (reasoning_content).
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              sent = true;
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err: any) {
          console.error('NVIDIA stream error:', err?.message || err);
        } finally {
          // Sin esto, un stream vacío o cortado dejaba la burbuja del chat en blanco.
          if (!sent) controller.enqueue(encoder.encode(FALLBACK_REPLY));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Chat API error:', error?.message || error);
    // El detalle del proveedor va al log, no al navegador.
    return new Response(JSON.stringify({ error: 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
