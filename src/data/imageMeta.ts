// ============================================================================
//  Metadescripciones (alt SEO) de las fotos de trabajos reales.
//  Úsalo para el atributo `alt` de <img>/<Image> en galerías, slides y el
//  modo inmersivo:  import { imageAlt } from '../data/imageMeta';
//                   <img src={src} alt={imageAlt(src)} />
//  Un buen alt mejora el SEO de imágenes y la accesibilidad.
// ============================================================================

export interface ImageMeta {
  alt: string;
  category: 'electricidad' | 'fontaneria' | 'climatizacion' | 'reformas';
}

export const imageMeta: Record<string, ImageMeta> = {
  // ---- Reformas integrales (acabados terminados) ----
  '/trabajos/reforma-cocina-moderna-marmol.jpeg': {
    alt: 'Reforma de cocina moderna con encimera y frente de mármol, vitrocerámica y horno en Barcelona',
    category: 'reformas',
  },
  '/trabajos/reforma-bano-marmol-espejo-led.jpeg': {
    alt: 'Reforma de baño con alicatado de mármol, plato de ducha y espejo con luz LED',
    category: 'reformas',
  },
  '/trabajos/reforma-cocina-salon-led.jpeg': {
    alt: 'Reforma integral de cocina y salón abierto con iluminación LED empotrada y salida a balcón',
    category: 'reformas',
  },
  '/trabajos/reforma-salon-cocina-parquet.jpeg': {
    alt: 'Reforma de salón-cocina con suelo de parquet, encimera de mármol e iluminación LED',
    category: 'reformas',
  },
  '/trabajos/reforma-habitacion-led-balconera.jpeg': {
    alt: 'Habitación reformada con paredes pintadas, focos LED y puerta balconera de aluminio',
    category: 'reformas',
  },
  '/trabajos/reforma-dormitorio-pladur-led.jpeg': {
    alt: 'Dormitorio reformado con pladur, focos LED y ventana corredera de aluminio',
    category: 'reformas',
  },
  '/trabajos/reforma-salon-clima-led.jpeg': {
    alt: 'Salón reformado con climatización por conductos e iluminación LED empotrada',
    category: 'reformas',
  },
  // ---- Reformas en proceso (equipo trabajando, confianza) ----
  '/trabajos/reforma-obra-albanileria-equipo.jpeg': {
    alt: 'Equipo de IS Instalaciones realizando trabajos de albañilería y mortero en una reforma',
    category: 'reformas',
  },
  '/trabajos/reforma-pladur-proceso-equipo.jpeg': {
    alt: 'Instalación de pladur y nivelado de suelo durante una reforma integral',
    category: 'reformas',
  },
  '/trabajos/reforma-techo-pladur-proceso.jpeg': {
    alt: 'Montaje de estructura metálica de techo y placas de pladur en obra',
    category: 'reformas',
  },
  '/trabajos/reforma-integral-obra-proceso.jpeg': {
    alt: 'Reforma integral en proceso con estructura de falso techo y tabiquería',
    category: 'reformas',
  },
  // ---- Electricidad ----
  '/trabajos/instalacion-electrica-cuadro-cableado.jpeg': {
    alt: 'Instalación eléctrica con cuadro de automáticos, cableado y cajas de registro',
    category: 'electricidad',
  },
  // ---- Climatización ----
  '/trabajos/climatizacion-split-aire-acondicionado.jpeg': {
    alt: 'Instalación de aire acondicionado split de pared en una vivienda',
    category: 'climatizacion',
  },
  '/trabajos/climatizacion-conductos-industrial.jpeg': {
    alt: 'Instalación industrial de conductos y tuberías de climatización',
    category: 'climatizacion',
  },
  '/trabajos/climatizacion-estructura-techo-conductos.jpeg': {
    alt: 'Estructura de falso techo y cableado para climatización por conductos',
    category: 'climatizacion',
  },
};

// Devuelve el alt de una imagen (o un alt genérico si no está catalogada).
export function imageAlt(src: string, fallback = 'Trabajo de reforma e instalación de IS Instalaciones en Barcelona'): string {
  return imageMeta[src]?.alt || fallback;
}
