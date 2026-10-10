// Datos del negocio para el schema (JSON-LD). Una sola fuente para Layout y páginas (F6-T3).
// IS Instalaciones es un negocio de zona de servicio: sin local abierto al público, solo domicilio fiscal
// (confirmado por el cliente 2026-10-10). Por eso el schema NO publica calle, código postal ni coordenadas.

export const SITE_URL = 'https://is-instalaciones.es';
export const BUSINESS_ID = `${SITE_URL}#localbusiness`;

// Ficha de Google Business (CID). El antiguo g.page/isinstalaciones acaba en una búsqueda de Google.
export const GOOGLE_BUSINESS_URL = 'https://www.google.com/maps?cid=16190346738766346927';

// Misma cobertura que public/llms.txt.
export const AREA_SERVED = [
  'Barcelona',
  "L'Hospitalet de Llobregat",
  'Badalona',
  'Santa Coloma de Gramenet',
  'Sant Adrià de Besòs',
  'Cornellà de Llobregat',
  'Esplugues de Llobregat',
  'Sant Just Desvern',
  'Sant Joan Despí',
].map((name) => ({ '@type': 'City', name }));

interface ServiceInput {
  name: string;
  serviceType: string;
  description: string;
  path: string;
}

// Service de una página de servicio, enlazado al negocio por @id.
export function serviceSchema({ name, serviceType, description, path }: ServiceInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}${path}#service`,
    name,
    serviceType,
    description,
    url: `${SITE_URL}${path}`,
    provider: { '@id': BUSINESS_ID },
    areaServed: AREA_SERVED,
  };
}
