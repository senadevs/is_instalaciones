import type { APIRoute } from 'astro';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import knowledgeBase from '../../data/knowledge.md?raw';

const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

const SYSTEM_PROMPT = `Eres ISBot, el asistente virtual de IS Instalaciones. Tu único propósito es ayudar a clientes y potenciales clientes con información sobre IS Instalaciones y sus servicios.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español
- Sé amable, profesional y conciso (máximo 2-3 frases cortas por respuesta)
- Usa saltos de línea para separar ideas, no metas todo en un párrafo largo
- Usa **negritas** para destacar lo importante
- SOLO habla sobre IS Instalaciones, sus servicios, horarios, zonas de cobertura y proceso de trabajo
- Si preguntan por precios o costes, di que ofrecemos presupuesto gratuito y personalizado tras visita técnica. NUNCA des cifras ni estimaciones
- Si preguntan algo que NO esté relacionado con IS Instalaciones (política, deportes, cocina, etc.), responde amablemente: "Solo puedo ayudarte con temas relacionados con nuestros servicios de instalaciones y reformas. ¿En qué puedo ayudarte sobre electricidad, fontanería, climatización o reformas?"
- Anima siempre a contactar por teléfono (637 59 17 36) o WhatsApp para respuesta inmediata
- No inventes información. Si no sabes algo, redirige al teléfono o WhatsApp
- Cuando menciones el teléfono o WhatsApp, hazlo de forma natural sin repetirte constantemente
- Puedes usar emojis con moderación para ser más cercano

TODA LA INFORMACIÓN DE LA EMPRESA:
${knowledgeBase}`;

export const POST: APIRoute = async ({ request }) => {
  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages } = await request.json();

    const openrouter = createOpenRouter({
      apiKey: OPENROUTER_API_KEY,
    });

    const result = streamText({
      model: openrouter('cognitivecomputations/dolphin-mistral-24b-venice-edition:free'),
      system: SYSTEM_PROMPT,
      messages,
      maxTokens: 300,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
