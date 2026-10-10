// Datos de Escombrocero, la empresa hermana de retirada de escombros y limpieza de obra.
// Fuente: repo escombrocero (src/config/site.ts y src/data/servicios.ts). Si cambian allí, actualizar aquí.

export interface EscombroceroService {
  slug: string;
  name: string;
  short: string;
  icon: string;
}

// /escombros aún NO se publica (decisión del cliente, 2026-10-10, X-T9). En false: sin enlaces en cabecera
// y footer, fuera del sitemap y la página responde 404. Para publicarla, poner true.
export const PUBLICAR_ESCOMBROS = false;

// Subdominio confirmado por el cliente (2026-10-01). El repo de Escombrocero aún declara escombrocero.es: corregir allí (X-T4).
export const ESCOMBROCERO_URL = "https://escombros.is-instalaciones.es";

export const escombroceroServices: EscombroceroService[] = [
  {
    slug: "limpieza-final-de-obra",
    name: "Limpieza final de obra",
    short:
      "Eliminamos el polvo fino y los restos de obra y dejamos el piso, local u oficina listo para entregar llaves.",
    icon: "lucide:sparkles",
  },
  {
    slug: "limpieza-de-obra-para-constructoras",
    name: "Limpieza para constructoras y promotoras",
    short:
      "Limpieza de entrega de viviendas por fases y por plantas, coordinada con el jefe de obra.",
    icon: "lucide:key-round",
  },
  {
    slug: "limpieza-despues-de-reforma",
    name: "Limpieza después de una reforma",
    short:
      "Dejamos la casa sin polvo ni restos de obra para que vuelvas a vivir en ella.",
    icon: "lucide:house",
  },
  {
    slug: "limpieza-de-cristales-y-restos-de-obra",
    name: "Limpieza de cristales y restos de obra",
    short:
      "Quitamos pintura, yeso, cemento, silicona y adhesivos sin rayar los acabados.",
    icon: "lucide:paint-roller",
  },
  {
    slug: "limpieza-de-locales-y-oficinas-post-obra",
    name: "Limpieza de locales y oficinas post-obra",
    short:
      "Tu local u oficina sin polvo ni restos de obra, listo para montar el mobiliario y abrir.",
    icon: "lucide:store",
  },
  {
    slug: "retirada-de-escombros",
    name: "Retirada de escombros",
    short:
      "Sacas, contenedores, carga y transporte a planta autorizada, con certificado de gestión de residuos.",
    icon: "lucide:truck",
  },
];

export const escombroceroServiceUrl = (slug: string) =>
  `${ESCOMBROCERO_URL}/servicios/${slug}`;
