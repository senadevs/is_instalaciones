// ============================================================================
//  Catálogo de datos puros del estimador (sin dependencias de three/react).
//  Alimenta el panel jerárquico, el render 3D, la planta 2D y el presupuesto.
// ============================================================================

// ---- Tipos de estancia -----------------------------------------------------
// def: [ancho, largo] por defecto en metros. shape: cómo se renderiza.
export const ROOM_TYPES = {
  salon:      { label: 'Salón',       icon: 'lucide:sofa',          color: '#10b981', def: [5, 4],    shape: 'room' },
  cocina:     { label: 'Cocina',      icon: 'lucide:cooking-pot',   color: '#f97316', def: [3, 3],    shape: 'room' },
  bano:       { label: 'Baño',        icon: 'lucide:bath',          color: '#3b82f6', def: [2, 2.5],  shape: 'room' },
  dormitorio: { label: 'Dormitorio',  icon: 'lucide:bed-double',    color: '#8b5cf6', def: [4, 3.5],  shape: 'room' },
  comedor:    { label: 'Comedor',     icon: 'lucide:utensils',      color: '#14b8a6', def: [4, 4],    shape: 'room' },
  pasillo:    { label: 'Pasillo',     icon: 'lucide:move-horizontal', color: '#eab308', def: [3, 1.5], shape: 'room' },
  recibidor:  { label: 'Recibidor',   icon: 'lucide:door-open',     color: '#a3a3a3', def: [2.5, 2],  shape: 'room' },
  oficina:    { label: 'Oficina',     icon: 'lucide:monitor',       color: '#0ea5e9', def: [3, 3],    shape: 'room' },
  vestidor:   { label: 'Vestidor',    icon: 'lucide:shirt',         color: '#d946ef', def: [2.5, 2],  shape: 'room' },
  lavadero:   { label: 'Lavadero',    icon: 'lucide:washing-machine', color: '#64748b', def: [2, 1.8], shape: 'room' },
  escalera:   { label: 'Escalera',    icon: 'lucide:chevrons-up',   color: '#a8a29e', def: [2, 3.5],  shape: 'room', vertical: true },
  ascensor:   { label: 'Ascensor',    icon: 'lucide:arrow-up-down', color: '#78716c', def: [1.6, 1.6], shape: 'room', vertical: true },
  rampa:      { label: 'Rampa',       icon: 'lucide:trending-up',   color: '#a8a29e', def: [1.6, 4.5], shape: 'room', vertical: true },
  terraza:    { label: 'Terraza',     icon: 'lucide:trees',         color: '#84cc16', def: [4, 3],    shape: 'terraza' },
  piscina:    { label: 'Piscina',     icon: 'lucide:waves',         color: '#06b6d4', def: [6, 3],    shape: 'piscina' },
  jacuzzi:    { label: 'Jacuzzi',     icon: 'lucide:bath',          color: '#22d3ee', def: [2.5, 2.5], shape: 'jacuzzi' },
};

// ---- Tipos de vivienda ------------------------------------------------------
export const VIVIENDAS = {
  piso:    { label: 'Piso',    garden: false },
  casa:    { label: 'Casa',    garden: true  },
  duplex:  { label: 'Dúplex',  garden: false },
  atico:   { label: 'Ático',   garden: false },
  local:   { label: 'Local',   garden: false },
  oficina: { label: 'Oficina', garden: false },
};

// Zonas exteriores (solo en viviendas con espacio exterior).
export const OUTDOOR = ['terraza', 'piscina', 'jacuzzi'];

// Nº de plantas (niveles) disponibles por tipo de inmueble.
export const VIVIENDA_PLANTAS = { piso: 1, casa: 2, duplex: 2, atico: 1, local: 1, oficina: 1 };
export const plantasFor = (v) => VIVIENDA_PLANTAS[v] || 1;
export const FLOOR_H = 3.05; // altura entre plantas (m)

// ---- REGLA: qué tipos de zona admite cada tipo de inmueble ------------------
export const VIVIENDA_ZONAS = {
  piso:    ['recibidor', 'pasillo', 'salon', 'comedor', 'cocina', 'bano', 'dormitorio', 'vestidor', 'lavadero', 'oficina', 'terraza'],
  casa:    ['recibidor', 'pasillo', 'escalera', 'ascensor', 'rampa', 'salon', 'comedor', 'cocina', 'bano', 'dormitorio', 'vestidor', 'lavadero', 'oficina', 'terraza', 'piscina', 'jacuzzi'],
  duplex:  ['recibidor', 'pasillo', 'escalera', 'ascensor', 'rampa', 'salon', 'comedor', 'cocina', 'bano', 'dormitorio', 'vestidor', 'lavadero', 'oficina', 'terraza'],
  atico:   ['recibidor', 'pasillo', 'salon', 'comedor', 'cocina', 'bano', 'dormitorio', 'vestidor', 'lavadero', 'oficina', 'terraza', 'jacuzzi'],
  local:   ['recibidor', 'pasillo', 'salon', 'cocina', 'bano', 'oficina'],
  oficina: ['recibidor', 'pasillo', 'salon', 'cocina', 'bano', 'oficina'],
};
export const zonasFor = (v) => VIVIENDA_ZONAS[v] || Object.keys(ROOM_TYPES);

// ---- PLANTILLA inicial por tipo de inmueble --------------------------------
// Array de plantas; cada planta es una lista de tipos de zona. Dúplex/casa
// arrancan SOLO con la planta baja: el usuario añade la planta alta cuando
// quiere (y entonces se clona alineada con una escalera de conexión).
export const TEMPLATES = {
  piso:    [['recibidor', 'pasillo', 'salon', 'cocina', 'bano', 'dormitorio', 'dormitorio']],
  atico:   [['recibidor', 'pasillo', 'salon', 'cocina', 'bano', 'dormitorio', 'terraza']],
  duplex:  [['recibidor', 'pasillo', 'salon', 'cocina', 'bano', 'dormitorio']],
  casa:    [['recibidor', 'pasillo', 'salon', 'comedor', 'cocina', 'bano', 'terraza']],
  local:   [['recibidor', 'salon', 'bano', 'oficina']],
  oficina: [['recibidor', 'oficina', 'salon', 'bano', 'cocina']],
};
export const templateFor = (v) => TEMPLATES[v] || TEMPLATES.piso;

// ---- Acabados / reforma -----------------------------------------------------
export const FINISHES = { estandar: 'Estándar', medio: 'Medio', premium: 'Premium', lujo: 'Lujo' };
export const REFORMS = { integral: 'Integral', parcial: 'Parcial', estetica: 'Estética' };

// ---- Tipos de puerta --------------------------------------------------------
// w: ancho por defecto del hueco (m). hoja: si dibuja hoja/cristal.
export const DOOR_KINDS = {
  batiente:  { label: 'Batiente',        w: 0.9,  hoja: 'panel' },
  doble:     { label: 'Doble hoja',      w: 1.5,  hoja: 'panel' },
  corredera: { label: 'Corredera',       w: 1.1,  hoja: 'panel' },
  cristal:   { label: 'Acristalada',     w: 1.0,  hoja: 'cristal' },
  arco:      { label: 'Arco / paso',     w: 1.3,  hoja: 'none' },
  hueco:     { label: 'Hueco abierto',   w: 2.2,  hoja: 'none' },
};

// ---- Tipos de ventana -------------------------------------------------------
// bottom/top: altura del hueco (m). slide: corredera (montante central).
export const WINDOW_KINDS = {
  fija:      { label: 'Ventana fija',      bottom: 0.95, top: 2.05 },
  corredera: { label: 'Ventana corredera', bottom: 0.95, top: 2.05, slide: true },
  oscilo:    { label: 'Oscilobatiente',    bottom: 0.95, top: 2.05 },
  abatible:  { label: 'Ventana abatible',  bottom: 0.95, top: 2.05 },
  balconera: { label: 'Balconera',         bottom: 0.05, top: 2.15 },
};

// ---- Árbol de SERVICIOS -----------------------------------------------------
// Cada servicio agrupa opciones reales de reforma. `opts` son toggles.
// Algunas opciones llevan render 3D (flag render) y/o color configurable.
export const SERVICES = {
  electricidad: {
    label: 'Electricidad', icon: 'lucide:zap', color: '#f59e0b',
    opts: [
      { key: 'led',       label: 'Iluminación LED', color: true, render: true, default: true },
      { key: 'enchufes',  label: 'Puntos de luz y enchufes' },
      { key: 'cuadro',    label: 'Cuadro eléctrico nuevo' },
      { key: 'instalacion', label: 'Instalación nueva completa' },
      { key: 'red',       label: 'Tomas de red / datos' },
      { key: 'tv',        label: 'Tomas de TV / antena' },
      { key: 'domotica',  label: 'Domótica' },
    ],
  },
  obra: {
    label: 'Albañilería', icon: 'lucide:hammer', color: '#92400e',
    opts: [
      { key: 'derribo',   label: 'Derribo de tabiques' },
      { key: 'tabiques',  label: 'Levantar tabiques' },
      { key: 'pladur',    label: 'Tabiquería de pladur' },
      { key: 'recrecido', label: 'Recrecido de suelo' },
      { key: 'impermeabilizacion', label: 'Impermeabilización' },
    ],
  },
  climatizacion: {
    label: 'Climatización', icon: 'lucide:thermometer-sun', color: '#06b6d4',
    opts: [
      { key: 'aire',         label: 'Aire acondicionado (split)', render: true },
      { key: 'aerotermia',   label: 'Aerotermia', render: true },
      { key: 'radiadores',   label: 'Radiadores', render: true },
      { key: 'sueloRadiante', label: 'Suelo radiante' },
      { key: 'ventilacion',  label: 'Ventilación / recuperador' },
    ],
  },
  fontaneria: {
    label: 'Fontanería', icon: 'lucide:droplets', color: '#3b82f6',
    opts: [
      { key: 'tuberias',  label: 'Renovación de tuberías' },
      { key: 'sanitarios', label: 'Sanitarios' },
      { key: 'griferia',  label: 'Grifería' },
      { key: 'termo',     label: 'Termo / caldera', render: true },
      { key: 'descalcificador', label: 'Descalcificador' },
      { key: 'desagues',  label: 'Desagües' },
    ],
  },
  carpinteria: {
    label: 'Carpintería', icon: 'lucide:door-closed', color: '#a16207',
    opts: [
      { key: 'puertas',   label: 'Puertas', default: true },
      { key: 'ventanas',  label: 'Ventanas', render: true },
      { key: 'armarios',  label: 'Armarios empotrados' },
    ],
  },
  revestimientos: {
    label: 'Revestimientos', icon: 'lucide:paintbrush', color: '#ec4899',
    opts: [
      { key: 'pintura',   label: 'Pintura', color: true, default: true },
      { key: 'alicatado', label: 'Alicatado / solado' },
      { key: 'tarima',    label: 'Tarima / parquet' },
      { key: 'pladur',    label: 'Pladur / falsos techos' },
    ],
  },
  mobiliario: {
    label: 'Mobiliario', icon: 'lucide:armchair', color: '#8b5cf6',
    opts: [
      { key: 'amueblar',  label: 'Amueblar la estancia', default: true },
    ],
  },
};

// ---- REGLA: qué servicios tienen sentido en cada tipo de zona --------------
// (un recibidor no necesita fontanería, un pasillo no se amuebla, etc.)
export const ZONE_SERVICES = {
  cocina:     ['electricidad', 'fontaneria', 'climatizacion', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  bano:       ['electricidad', 'fontaneria', 'climatizacion', 'revestimientos', 'carpinteria', 'obra'],
  lavadero:   ['electricidad', 'fontaneria', 'revestimientos', 'obra'],
  salon:      ['electricidad', 'climatizacion', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  comedor:    ['electricidad', 'climatizacion', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  dormitorio: ['electricidad', 'climatizacion', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  oficina:    ['electricidad', 'climatizacion', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  vestidor:   ['electricidad', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  recibidor:  ['electricidad', 'revestimientos', 'carpinteria', 'obra', 'mobiliario'],
  pasillo:    ['electricidad', 'revestimientos', 'carpinteria', 'obra'],
  escalera:   ['electricidad', 'revestimientos', 'obra'],
  rampa:      ['electricidad', 'revestimientos', 'obra'],
  ascensor:   ['electricidad', 'obra'],
  terraza:    ['electricidad', 'fontaneria', 'revestimientos', 'obra', 'mobiliario'],
  piscina:    ['fontaneria', 'electricidad', 'obra', 'revestimientos'],
  jacuzzi:    ['fontaneria', 'electricidad', 'obra'],
};
export const servicesFor = (type) => ZONE_SERVICES[type] || Object.keys(SERVICES);

// Servicios sugeridos por defecto según el tipo de estancia.
export const DEFAULT_SERVICES = {
  cocina:     ['electricidad', 'fontaneria', 'revestimientos', 'mobiliario'],
  bano:       ['electricidad', 'fontaneria', 'revestimientos'],
  salon:      ['electricidad', 'revestimientos', 'mobiliario'],
  dormitorio: ['electricidad', 'revestimientos', 'mobiliario'],
  comedor:    ['electricidad', 'revestimientos', 'mobiliario'],
  default:    ['electricidad', 'revestimientos'],
};

// ---- Extras a nivel inmueble ------------------------------------------------
export const EXTRAS = [
  { key: 'fotovoltaica', label: 'Placas fotovoltaicas', icon: 'lucide:sun' },
  { key: 'videoportero', label: 'Videoportero', icon: 'lucide:video' },
  { key: 'domotica',     label: 'Domótica integral', icon: 'lucide:house-plug' },
  { key: 'cargador',     label: 'Cargador VE', icon: 'lucide:plug-zap' },
  { key: 'alarma',       label: 'Alarma / seguridad', icon: 'lucide:shield' },
];

// ---- Paletas de color -------------------------------------------------------
export const PAINT_PRESETS = ['#ffffff', '#f1f5f9', '#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#ddd6fe', '#fed7aa'];
export const LED_PRESETS = ['#fff7cc', '#ffffff', '#bfdbfe', '#fde68a', '#fca5a5', '#bbf7d0'];
export const WALL_DEFAULT = '#ece9e3';

// ---- Catálogo de mobiliario (paleta arrastrable) ----------------------------
// model: clave en MODELS (models.jsx). w/d: footprint en metros para validar
// que cabe (AABB). cat: categoría para agrupar en la paleta.
export const FURNITURE_CATALOG = [
  // Salón
  { key: 'sofa',        model: 'sofa',        label: 'Sofá',           cat: 'salon',  w: 1.6, d: 0.85 },
  { key: 'sofaLong',    model: 'sofaLong',    label: 'Sofá grande',    cat: 'salon',  w: 2.2, d: 0.9 },
  { key: 'sofaCorner',  model: 'sofaCorner',  label: 'Sofá rinconera', cat: 'salon',  w: 2.2, d: 1.6 },
  { key: 'sofaOttoman', model: 'sofaOttoman', label: 'Sofá chaise',    cat: 'salon',  w: 2.0, d: 1.0 },
  { key: 'designSofa',  model: 'designSofa',  label: 'Sofá diseño',    cat: 'salon',  w: 2.0, d: 0.9 },
  { key: 'armchair',    model: 'armchair',    label: 'Butaca',         cat: 'salon',  w: 0.8, d: 0.8 },
  { key: 'armchairRelax', model: 'armchairRelax', label: 'Butaca relax', cat: 'salon', w: 0.9, d: 1.0 },
  { key: 'designChair', model: 'designChair', label: 'Silla diseño',   cat: 'salon',  w: 0.8, d: 0.8 },
  { key: 'coffeeTable', model: 'coffeeTable', label: 'Mesa de centro', cat: 'salon',  w: 1.0, d: 0.6 },
  { key: 'coffeeTableGlass', model: 'coffeeTableGlass', label: 'Mesa centro cristal', cat: 'salon', w: 1.0, d: 0.6 },
  { key: 'tvCabinet',   model: 'tvCabinet',   label: 'Mueble TV',      cat: 'salon',  w: 1.4, d: 0.4 },
  { key: 'tvCabinetDoors', model: 'tvCabinetDoors', label: 'Mueble TV cerrado', cat: 'salon', w: 1.4, d: 0.4 },
  { key: 'tv',          model: 'tv',          label: 'Televisor',      cat: 'salon',  w: 1.2, d: 0.1 },
  { key: 'tvVintage',   model: 'tvVintage',   label: 'TV vintage',     cat: 'salon',  w: 0.9, d: 0.5 },
  { key: 'bookcaseWide', model: 'bookcaseWide', label: 'Librería ancha', cat: 'salon', w: 1.6, d: 0.4 },
  { key: 'books',       model: 'books',       label: 'Libros',         cat: 'salon',  w: 0.4, d: 0.3 },
  { key: 'speaker',     model: 'speaker',     label: 'Altavoz',        cat: 'salon',  w: 0.4, d: 0.4 },
  { key: 'radio',       model: 'radio',       label: 'Radio',          cat: 'salon',  w: 0.4, d: 0.3 },
  // Comedor
  { key: 'table',       model: 'table',       label: 'Mesa',           cat: 'comedor', w: 1.2, d: 0.8 },
  { key: 'tableRound',  model: 'tableRound',  label: 'Mesa redonda',   cat: 'comedor', w: 1.2, d: 1.2 },
  { key: 'tableGlass',  model: 'tableGlass',  label: 'Mesa cristal',   cat: 'comedor', w: 1.4, d: 0.9 },
  { key: 'chair',       model: 'chair',       label: 'Silla',          cat: 'comedor', w: 0.5, d: 0.5 },
  { key: 'chairCushion', model: 'chairCushion', label: 'Silla acolchada', cat: 'comedor', w: 0.5, d: 0.5 },
  { key: 'chairModern', model: 'chairModern', label: 'Silla moderna',  cat: 'comedor', w: 0.5, d: 0.5 },
  { key: 'bench',       model: 'bench',       label: 'Banco',          cat: 'comedor', w: 1.2, d: 0.4 },
  { key: 'stoolBar',    model: 'stoolBar',    label: 'Taburete bar',   cat: 'comedor', w: 0.45, d: 0.45 },
  // Dormitorio
  { key: 'bed',         model: 'bed',         label: 'Cama doble',     cat: 'dormitorio', w: 1.6, d: 2.0 },
  { key: 'bedSingle',   model: 'bedSingle',   label: 'Cama individual', cat: 'dormitorio', w: 1.0, d: 2.0 },
  { key: 'bedBunk',     model: 'bedBunk',     label: 'Litera',         cat: 'dormitorio', w: 1.0, d: 2.0 },
  { key: 'nightstand',  model: 'nightstand',  label: 'Mesita',         cat: 'dormitorio', w: 0.5, d: 0.4 },
  { key: 'sideTable',   model: 'sideTable',   label: 'Mesa auxiliar',  cat: 'dormitorio', w: 0.5, d: 0.4 },
  { key: 'wardrobe',    model: 'wardrobe',    label: 'Armario',        cat: 'dormitorio', w: 1.2, d: 0.6 },
  { key: 'coatRack',    model: 'coatRack',    label: 'Perchero',       cat: 'dormitorio', w: 0.5, d: 0.5 },
  // Cocina
  { key: 'kitchenCabinet', model: 'kitchenCabinet', label: 'Módulo bajo', cat: 'cocina', w: 0.9, d: 0.6 },
  { key: 'kitchenCabinetDrawer', model: 'kitchenCabinetDrawer', label: 'Módulo cajones', cat: 'cocina', w: 0.9, d: 0.6 },
  { key: 'kitchenBar',  model: 'kitchenBar',  label: 'Isla / barra',   cat: 'cocina', w: 1.2, d: 0.6 },
  { key: 'kitchenUpper', model: 'kitchenUpper', label: 'Módulo alto',  cat: 'cocina', w: 0.9, d: 0.4 },
  { key: 'kitchenFridge', model: 'kitchenFridge', label: 'Nevera',     cat: 'cocina', w: 0.7, d: 0.7 },
  { key: 'kitchenFridgeLarge', model: 'kitchenFridgeLarge', label: 'Nevera grande', cat: 'cocina', w: 0.9, d: 0.7 },
  { key: 'kitchenSink', model: 'kitchenSink', label: 'Fregadero',      cat: 'cocina', w: 0.9, d: 0.6 },
  { key: 'kitchenStove', model: 'kitchenStove', label: 'Cocina/horno', cat: 'cocina', w: 0.9, d: 0.6 },
  { key: 'kitchenStoveElectric', model: 'kitchenStoveElectric', label: 'Vitrocerámica', cat: 'cocina', w: 0.9, d: 0.6 },
  { key: 'hood',        model: 'hood',        label: 'Campana',        cat: 'cocina', w: 0.9, d: 0.5 },
  { key: 'microwave',   model: 'microwave',   label: 'Microondas',     cat: 'cocina', w: 0.5, d: 0.4 },
  { key: 'coffeeMachine', model: 'coffeeMachine', label: 'Cafetera',   cat: 'cocina', w: 0.4, d: 0.4 },
  { key: 'washer',      model: 'washer',      label: 'Lavadora',       cat: 'cocina', w: 0.6, d: 0.6 },
  { key: 'dryer',       model: 'dryer',       label: 'Secadora',       cat: 'cocina', w: 0.6, d: 0.6 },
  // Baño
  { key: 'toilet',      model: 'toilet',      label: 'Inodoro',        cat: 'bano', w: 0.5, d: 0.7 },
  { key: 'toiletSquare', model: 'toiletSquare', label: 'Inodoro moderno', cat: 'bano', w: 0.5, d: 0.7 },
  { key: 'bathSink',    model: 'bathSink',    label: 'Lavabo',         cat: 'bano', w: 0.6, d: 0.5 },
  { key: 'bathSinkSquare', model: 'bathSinkSquare', label: 'Lavabo cuadrado', cat: 'bano', w: 0.6, d: 0.5 },
  { key: 'bathtub',     model: 'bathtub',     label: 'Bañera',         cat: 'bano', w: 1.7, d: 0.8 },
  { key: 'shower',      model: 'shower',      label: 'Ducha',          cat: 'bano', w: 0.9, d: 0.9 },
  { key: 'showerRound', model: 'showerRound', label: 'Ducha redonda',  cat: 'bano', w: 0.9, d: 0.9 },
  { key: 'bathCabinet', model: 'bathCabinet', label: 'Mueble baño',    cat: 'bano', w: 0.6, d: 0.3 },
  { key: 'bathMirror',  model: 'bathMirror',  label: 'Espejo',         cat: 'bano', w: 0.6, d: 0.1 },
  // Oficina
  { key: 'desk',        model: 'desk',        label: 'Escritorio',     cat: 'oficina', w: 1.2, d: 0.6 },
  { key: 'deskCorner',  model: 'deskCorner',  label: 'Escritorio esquina', cat: 'oficina', w: 1.4, d: 1.4 },
  { key: 'deskChair',   model: 'deskChair',   label: 'Silla oficina',  cat: 'oficina', w: 0.6, d: 0.6 },
  { key: 'computer',    model: 'computer',    label: 'Ordenador',      cat: 'oficina', w: 0.5, d: 0.2 },
  { key: 'laptop',      model: 'laptop',      label: 'Portátil',       cat: 'oficina', w: 0.4, d: 0.3 },
  // Iluminación
  { key: 'floorLamp',   model: 'floorLamp',   label: 'Lámpara de pie', cat: 'luz', w: 0.4, d: 0.4 },
  { key: 'floorLampSquare', model: 'floorLampSquare', label: 'Lámpara pie cuadrada', cat: 'luz', w: 0.4, d: 0.4 },
  { key: 'tableLamp',   model: 'tableLamp',   label: 'Lámpara mesa',   cat: 'luz', w: 0.3, d: 0.3 },
  // Deco
  { key: 'plant',       model: 'plant',       label: 'Planta',         cat: 'deco', w: 0.5, d: 0.5 },
  { key: 'plantSmall',  model: 'plantSmall',  label: 'Planta pequeña', cat: 'deco', w: 0.35, d: 0.35 },
  { key: 'plantSmall2', model: 'plantSmall2', label: 'Cactus',         cat: 'deco', w: 0.35, d: 0.35 },
  { key: 'rug',         model: 'rug',         label: 'Alfombra',       cat: 'deco', w: 2.0, d: 1.4 },
  { key: 'rugRound',    model: 'rugRound',    label: 'Alfombra redonda', cat: 'deco', w: 1.6, d: 1.6 },
  { key: 'rugSquare',   model: 'rugSquare',   label: 'Alfombra cuadrada', cat: 'deco', w: 1.6, d: 1.6 },
  { key: 'doormat',     model: 'doormat',     label: 'Felpudo',        cat: 'deco', w: 0.8, d: 0.5 },
  { key: 'bookcase',    model: 'bookcase',    label: 'Estantería',     cat: 'deco', w: 1.2, d: 0.4 },
  { key: 'trashcan',    model: 'trashcan',    label: 'Papelera',       cat: 'deco', w: 0.3, d: 0.3 },
  { key: 'bear',        model: 'bear',        label: 'Peluche',        cat: 'deco', w: 0.4, d: 0.4 },
];

export const FURNITURE_CATS = {
  salon: 'Salón', comedor: 'Comedor', dormitorio: 'Dormitorio',
  cocina: 'Cocina', bano: 'Baño', oficina: 'Oficina', luz: 'Iluminación', deco: 'Decoración',
};

// Acceso rápido por clave.
export const FURNITURE_BY_KEY = Object.fromEntries(FURNITURE_CATALOG.map((f) => [f.key, f]));

// ---- Auto-amueblado en términos de catálogo --------------------------------
// Devuelve [{ key, px, pz, rot }] en coords LOCALES de la estancia (centro 0,0,
// suelo y=0). Lo usan tanto la planta 2D como el 3D (fuente de verdad única).
export function autoFurnish(type, w, l) {
  const back = -l / 2 + 0.55, front = l / 2 - 0.55;
  const left = -w / 2 + 0.45, right = w / 2 - 0.45;
  const P = Math.PI;
  switch (type) {
    case 'salon': return [
      { key: 'rug', px: 0, pz: 0, rot: 0 },
      { key: 'sofa', px: 0, pz: back, rot: 0 },
      { key: 'coffeeTable', px: 0, pz: back + 1.1, rot: 0 },
      { key: 'tvCabinet', px: 0, pz: front, rot: P },
      { key: 'tv', px: 0, pz: front - 0.05, rot: P },
      { key: 'plant', px: left, pz: front, rot: 0 },
    ];
    case 'comedor': return [
      { key: 'table', px: 0, pz: 0, rot: 0 },
      { key: 'chair', px: 0, pz: -0.9, rot: 0 },
      { key: 'chair', px: 0, pz: 0.9, rot: P },
      { key: 'chair', px: -0.9, pz: 0, rot: P / 2 },
      { key: 'chair', px: 0.9, pz: 0, rot: -P / 2 },
    ];
    case 'cocina': return [
      { key: 'kitchenFridge', px: left, pz: back, rot: P / 2 },
      { key: 'kitchenStove', px: left, pz: back + 1, rot: P / 2 },
      { key: 'kitchenCabinet', px: left, pz: back + 1.9, rot: P / 2 },
      { key: 'kitchenSink', px: left, pz: back + 2.8, rot: P / 2 },
    ];
    case 'bano': return [
      { key: 'toilet', px: left, pz: back, rot: P / 2 },
      { key: 'bathSink', px: right, pz: back, rot: -P / 2 },
      { key: 'bathtub', px: 0, pz: front, rot: P },
    ];
    case 'dormitorio': return [
      { key: 'bed', px: 0, pz: back + 0.7, rot: 0 },
      { key: 'nightstand', px: left, pz: back, rot: 0 },
      { key: 'nightstand', px: right, pz: back, rot: 0 },
      { key: 'wardrobe', px: right, pz: front, rot: P },
    ];
    case 'oficina': case 'local': return [
      { key: 'desk', px: 0, pz: back, rot: 0 },
      { key: 'deskChair', px: 0, pz: back + 0.8, rot: P },
      { key: 'plant', px: left, pz: front, rot: 0 },
    ];
    default: return [];
  }
}

// ---- REGLA: qué categorías de mobiliario admite cada zona -------------------
// Evita sinsentidos (p. ej. un inodoro en la cocina): el inodoro es categoría
// 'bano', y 'cocina' no incluye 'bano'.
export const ZONE_CATS = {
  salon:      ['salon', 'comedor', 'luz', 'deco'],
  comedor:    ['comedor', 'salon', 'luz', 'deco'],
  cocina:     ['cocina', 'comedor', 'luz', 'deco'],
  bano:       ['bano', 'luz', 'deco'],
  dormitorio: ['dormitorio', 'salon', 'luz', 'deco'],
  oficina:    ['oficina', 'salon', 'luz', 'deco'],
  vestidor:   ['dormitorio', 'luz', 'deco'],
  lavadero:   ['cocina', 'deco'],
  pasillo:    ['luz', 'deco'],
  escalera:   ['deco'],
  rampa:      ['deco'],
  ascensor:   ['deco'],
  recibidor:  ['dormitorio', 'luz', 'deco'],
  terraza:    ['comedor', 'salon', 'luz', 'deco'],
  piscina:    ['deco'],
  jacuzzi:    ['deco'],
};
export const catsFor = (type) => ZONE_CATS[type] || ['luz', 'deco'];

// ¿Se puede colocar este elemento (por su categoría) en este tipo de zona?
export function furnitureAllowed(roomType, itemKey) {
  const it = FURNITURE_BY_KEY[itemKey];
  return !!it && catsFor(roomType).includes(it.cat);
}

// REGLA: elementos que NO se dibujan en el plano (mobiliario suelto/menor:
// sillas, mesas, deco). Los fijos (estantería, armario, sanitarios, cocina,
// electrodomésticos, camas, sofás…) sí aparecen.
export const PLAN_HIDE = new Set([
  'chair', 'chairCushion', 'chairModern', 'deskChair', 'stoolBar', 'bench',
  'table', 'tableRound', 'tableGlass', 'coffeeTable', 'coffeeTableGlass', 'sideTable',
  'plant', 'plantSmall', 'plantSmall2', 'rug', 'rugRound', 'rugSquare', 'doormat',
  'books', 'radio', 'speaker', 'bear', 'trashcan',
  'floorLamp', 'floorLampSquare', 'tableLamp', 'computer', 'laptop',
]);
export const showsInPlan = (itemKey) => !PLAN_HIDE.has(itemKey);
