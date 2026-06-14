export interface ImmersiveService {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  images: string[];
  cta: { label: string; href: string };
}

export interface ImmersiveTool {
  action: string;
  label: string;
  icon: string;
  hint: string;
}

export const immersiveContent = {
  tools: [
    { action: 'scene', label: 'Crear escena', icon: 'sparkles', hint: 'Composición editorial desde cero' },
    { action: 'services', label: 'Servicios', icon: 'layout-grid', hint: 'Ver todas las áreas de trabajo' },
    { action: 'service:electricidad', label: 'Electricidad', icon: 'zap', hint: 'Cuadros, averías, iluminación' },
    { action: 'service:climatizacion', label: 'Climatización', icon: 'snowflake', hint: 'Aire y calefacción' },
    { action: 'gallery:reformas', label: 'Trabajos', icon: 'image', hint: 'Ver acabados reales' },
    { action: 'contact', label: 'Contacto', icon: 'phone', hint: 'Llamar o WhatsApp' },
    { action: 'coverage', label: 'Cobertura', icon: 'map-pinned', hint: 'Zonas de servicio' },
    { action: 'emergency', label: 'Urgente', icon: 'alert-triangle', hint: 'Avería prioritaria' },
  ] satisfies ImmersiveTool[],
  servicePacks: {
    electricidad: {
      title: 'Instalaciones Eléctricas',
      description: 'Cuadros eléctricos, averías, porteros automáticos, iluminación y mantenimiento profesional.',
      icon: '⚡',
      accent: 'from-amber-400 to-orange-500',
      images: [
        '/trabajos/instalacion-electrica-cuadro-cableado.jpeg',
        '/trabajos/contadores-electricos.jpeg',
        '/trabajos/instalacion-interfono.jpeg',
        '/trabajos/montaje_fusibles.jpeg',
        '/trabajos/reforma-electricidad.jpeg',
      ],
      cta: { label: 'Hablar de electricidad', href: 'tel:+34637591736' },
    },
    fontaneria: {
      title: 'Fontanería y Saneamiento',
      description: 'Fugas, tuberías, contadores, fregaderos, atascos y saneamiento para viviendas y locales.',
      icon: '💧',
      accent: 'from-blue-400 to-cyan-500',
      images: [
        '/trabajos/fontaneria-contadores.jpeg',
        '/trabajos/fontaneria-fregadero.jpeg',
        '/trabajos/fontaneria-tuberias.jpeg',
      ],
      cta: { label: 'Consultar fontanería', href: 'tel:+34637591736' },
    },
    climatizacion: {
      title: 'Climatización y Calefacción',
      description: 'Instalación, reparación y mantenimiento de aire acondicionado, conductos y calefacción.',
      icon: '❄️',
      accent: 'from-cyan-400 to-sky-600',
      images: [
        '/trabajos/climatizacion-split-aire-acondicionado.jpeg',
        '/trabajos/climatizacion-conductos-industrial.jpeg',
        '/trabajos/climatizacion-conductos.jpeg',
        '/trabajos/ac-exterior-mitsubishi.jpeg',
        '/trabajos/ac-exterior-ladrillo.jpeg',
        '/trabajos/conductos-techo.jpeg',
        '/trabajos/climatizacion-estructura-techo-conductos.jpeg',
        '/trabajos/mantenimiento-ac.jpeg',
      ],
      cta: { label: 'Ver climatización', href: 'tel:+34637591736' },
    },
    reformas: {
      title: 'Reformas Integrales',
      description: 'Reformas de cocinas, baños, salones, pladur, iluminación y renovación integral.',
      icon: '🔨',
      accent: 'from-emerald-500 to-teal-700',
      images: [
        '/trabajos/reforma-cocina-moderna-marmol.jpeg',
        '/trabajos/reforma-bano-marmol-espejo-led.jpeg',
        '/trabajos/reforma-cocina-salon-led.jpeg',
        '/trabajos/reforma-salon-cocina-parquet.jpeg',
        '/trabajos/reforma-habitacion-led-balconera.jpeg',
        '/trabajos/reforma-dormitorio-pladur-led.jpeg',
        '/trabajos/reforma-salon-clima-led.jpeg',
        '/trabajos/reforma-cocina.jpeg',
        '/trabajos/reforma-salon-led.jpeg',
        '/trabajos/reforma-pladur.jpeg',
        '/trabajos/pladur-bano.jpeg',
        '/trabajos/techo-led-clima.jpeg',
        '/trabajos/reforma-obra-albanileria-equipo.jpeg',
        '/trabajos/reforma-pladur-proceso-equipo.jpeg',
        '/trabajos/reforma-techo-pladur-proceso.jpeg',
        '/trabajos/reforma-integral-obra-proceso.jpeg',
      ],
      cta: { label: 'Planear reforma', href: 'tel:+34637591736' },
    },
  } satisfies Record<string, ImmersiveService>,
  contact: {
    phone: '637 59 17 36',
    telHref: 'tel:+34637591736',
    whatsappHref: 'https://wa.me/34637591736',
    email: 'isinstalacionesbcn@gmail.com',
  },
  coverage: [
    'Barcelona ciudad',
    "L'Hospitalet",
    'Badalona',
    'Santa Coloma',
    'Sant Adrià',
    'Cornellà',
    'Esplugues',
    'Sant Just Desvern',
    'Sant Joan Despí',
  ],
  scenePresets: {
    scene: {
      title: 'Construye una escena visual propia',
      lead: 'Pide una composición personalizada y el modelo la construye con imagen, texto, chips y tarjetas.',
      body: 'El objetivo es que el asistente no solo seleccione una card predefinida: puede inventar una portada editorial nueva, elegir un pack de imágenes, proponer un ángulo visual y crear bloques de apoyo según la intención del usuario.',
      images: 'mix',
      layout: 'editorial',
    },
    hero: {
      title: 'Portada inmersiva',
      lead: 'Un arranque potente con imagen principal, idea clara y CTA visible.',
      body: 'Ideal para abrir una conversación con una pieza fuerte de marca, como si fuera una landing dentro del chat.',
      images: 'mix',
      layout: 'hero',
    },
    gallery: {
      title: 'Galería editorial',
      lead: 'Muestra trabajos reales con una jerarquía más visual y menos cartesiana.',
      body: 'Aquí la imagen manda. El texto acompaña y la composición debe parecer una selección curada.',
      images: 'mix',
      layout: 'gallery',
    },
  },
};
