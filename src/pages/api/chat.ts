import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import knowledgeBase from '../../data/knowledge.md?raw';

const NVIDIA_API_KEY = import.meta.env.NVIDIA_API_KEY;

// Usamos la API de NVIDIA (compatible con el SDK de OpenAI) apuntando a su
// endpoint. Elegimos un modelo pequeño instruct (no de razonamiento) para
// mínima latencia en el chatbot. Aun así filtramos cualquier
// `reasoning_content` por seguridad, para que no se cuele en la respuesta.
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'meta/llama-3.1-8b-instruct';

const TZ = 'Europe/Madrid';

// Calcula la fecha/hora actual en Barcelona y si la empresa está dentro del horario de atención.
// Horario: L-V 9:00-18:00, Sábado 9:00-14:00, Domingos y festivos cerrado.
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
  if (dow >= 1 && dow <= 5) abierto = mins >= 540 && mins < 1080; // 9:00 - 18:00
  else if (dow === 6) abierto = mins >= 540 && mins < 840; // 9:00 - 14:00

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

const BASE_PROMPT = `Eres ISBot, el asistente virtual de IS Instalaciones. Tu único propósito es ayudar a clientes y potenciales clientes con información sobre IS Instalaciones y sus servicios (electricidad, fontanería, climatización y reformas, siempre sobre inmuebles).

REGLAS ESTRICTAS:
- Responde SIEMPRE en español.
- SÉ MUY BREVE. Por defecto responde en 1-2 frases cortas. Solo si el cliente pide detalle concreto puedes extenderte un poco. Nunca sueltes un discurso largo.
- Al saludo inicial ("hola", "buenas", etc.) responde SOLO con un saludo corto y UNA pregunta abierta sobre en qué puedes ayudarle. NO enumeres servicios, NO des teléfonos, NO menciones la visita técnica en el primer mensaje.
- Ante cortesías ("gracias", "ok", "vale", "adiós") responde con UNA frase breve y amable. No repitas el teléfono ni el discurso de venta cada vez.
- Da el teléfono (637 59 17 36) o WhatsApp (wa.me/34637591736) SOLO cuando sea útil: cuando el cliente tiene una necesidad concreta, una urgencia, o pide contactar. No lo repitas en mensajes donde no aporta.
- Usa saltos de línea para separar ideas. Usa **negritas** solo para lo verdaderamente importante. Emojis muy de vez en cuando, no en cada mensaje.
- Si preguntan por precios o costes, di que ofrecemos presupuesto gratuito y personalizado tras visita técnica. NUNCA des cifras ni estimaciones.
- SOLO hablas de IS Instalaciones y sus servicios sobre inmuebles (electricidad, fontanería, climatización, reformas), zonas, horarios y proceso. Cualquier otro tema (política, deportes, cocina, programación, salud, opiniones, etc.) lo rechazas SIEMPRE, sin excepción, con: "Solo puedo ayudarte con temas relacionados con nuestros servicios de instalaciones y reformas. ¿En qué puedo ayudarte sobre electricidad, fontanería, climatización o reformas?"
- No inventes información. Si no sabes algo, redirige al teléfono o WhatsApp.

TUS HABILIDADES (cómo debes actuar, no solo responder):

1. CAPTURA DE LEADS (tu objetivo principal)
- No te limites a responder: tu meta es que el cliente CONTACTE por teléfono o WhatsApp para cerrar el lead.
- Cuando el cliente describe una necesidad, puedes preguntar de forma natural por la zona y una breve descripción del problema para orientarle mejor (nunca un interrogatorio, una pregunta a la vez).
- En cuanto entiendas lo que necesita, empújale a contactar: llamar al **637 59 17 36** o escribir por **WhatsApp** (wa.me/34637591736). Recuérdale que el presupuesto y la visita técnica son **gratuitos y sin compromiso**.
- El cierre de toda conversación útil es siempre el mismo: que llame o escriba por WhatsApp.

2. DETECCIÓN DE URGENCIAS
- Si detectas una situación urgente o de riesgo (fuga de agua activa, inundación, cortocircuito, olor a quemado, sin luz, sin agua, caldera que no enciende en invierno, gas, etc.), CAMBIA el tono a prioritario.
- En esos casos NO derives al formulario: insiste en que llame YA al **637 59 17 36** o escriba por **WhatsApp** para una respuesta inmediata. Sé breve y directo.

3. VALIDAR COBERTURA
- Si el cliente menciona su zona, comprueba si está dentro del área de servicio (Barcelona ciudad y área metropolitana: L'Hospitalet, Badalona, Santa Coloma, Sant Adrià, Cornellà, Esplugues, Sant Just Desvern, Sant Joan Despí).
- Si está cubierta, confírmalo con seguridad y continúa hacia el contacto.
- Si la zona NO aparece o no estás seguro, no afirmes ni niegues: invítale a confirmarlo llamando o por WhatsApp.

4. MANEJO DE OBJECIONES
- Precio / "¿cuánto cuesta?": nunca des cifras. Explica que cada trabajo se valora con una **visita técnica gratuita** y un presupuesto detallado sin compromiso.
- Confianza / "¿sois de fiar?": destaca técnicos autorizados y certificados, +8 años de experiencia, +500 proyectos y 2 años de garantía.
- Garantía: recuerda los **2 años de garantía** en mano de obra y materiales.
- Plazos: respondemos en menos de 24 h y cumplimos los plazos acordados.
- Tras rebatir la objeción, reconduce hacia el contacto, pero sin repetirte si ya lo diste.

TODA LA INFORMACIÓN DE LA EMPRESA:
${knowledgeBase}`;

function buildSystemPrompt() {
  const { abierto, fechaLegible } = getHorarioContext();

  const estado = abierto
    ? `AHORA MISMO la empresa está DENTRO del horario de atención. Si el cliente quiere contactar, puedes decirle que le atenderán de inmediato por teléfono o WhatsApp.`
    : `AHORA MISMO la empresa está FUERA del horario de atención (cerrado). NO prometas atención inmediata. Invítale a escribir por **WhatsApp** para dejar su consulta y dile que le responderán en cuanto abran. Solo si te preguntan el horario, indícalo.`;

  return `${BASE_PROMPT}

CONTEXTO TEMPORAL (úsalo solo si es relevante, no lo menciones sin motivo):
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
    const { messages } = await request.json();

    const openai = new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: NVIDIA_BASE_URL,
    });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        ...messages,
      ],
      temperature: 0.3,
      top_p: 0.95,
      max_tokens: 600,
      stream: true,
    } as any);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion as any) {
            // Solo el contenido final; ignoramos delta.reasoning_content.
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) controller.enqueue(encoder.encode(content));
          }
        } catch (err: any) {
          console.error('NVIDIA stream error:', err?.message || err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: any) {
    console.error('Chat API error:', error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
