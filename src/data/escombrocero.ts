// Datos de Escombrocero, la empresa hermana de retirada de escombros y limpieza de obra.
// Fuente: repo escombrocero (src/config/site.ts y src/data/servicios.ts). Si cambian allí, actualizar aquí.

export interface EscombroceroService {
  slug: string;
  name: string;
  short: string;
  icon: string;
}

// PENDIENTE-CONFIRMAR: el cliente indicó escombros.is-instalaciones.es; el repo de Escombrocero usa escombrocero.es.
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
