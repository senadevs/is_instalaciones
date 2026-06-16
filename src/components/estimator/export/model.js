import {
  FURNITURE_BY_KEY,
  ROOM_TYPES,
  SERVICES,
  VIVIENDAS,
  showsInPlan,
} from '../catalog.js';
import {
  computeWalls,
  fittedAuto,
  footprint,
  getOpening,
  pickEntrance,
  placeRooms,
} from '../geometry.js';

export const PLAN_MODEL_VERSION = 1;
export const PLAN_WALL_THICKNESS = 0.1;

const SIDES = ['n', 's', 'e', 'w'];

/**
 * @typedef {{ x: number, y: number }} PlanPoint
 * @typedef {{ roomId: number|string, key: string, label: string, center: PlanPoint, width: number, depth: number, rotation: number }} PlanFixture
 * @typedef {{ roomId: number|string, side: string, kind: string, role: string, width: number, center: PlanPoint, start: PlanPoint, end: PlanPoint, layer: string, slide?: boolean, hoja?: string }} PlanOpening
 * @typedef {{ roomId: number|string, orientation: 'horizontal'|'vertical', start: PlanPoint, end: PlanPoint, text: string, layer: string }} PlanDimension
 * @typedef {{ id: string, level: number, name: string, bounds: { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }, rooms: Array<object>, walls: Array<object>, openings: PlanOpening[], fixtures: PlanFixture[], dimensions: PlanDimension[], legend: Array<object>, validations: Array<object> }} PlanSheet
 * @typedef {{ version: number, unit: string, wallThickness: number, meta: object, validations: Array<object>, sheets: PlanSheet[] }} PlanModel
 */

export function buildPlanModel(rooms = [], setup = {}, options = {}) {
  const placed = placeRooms(Array.isArray(rooms) ? rooms : []);
  const walls = computeWalls(placed);
  const entrance = pickEntrance(placed, walls);
  const validations = validateRooms(placed);
  const levels = [...new Set(placed.map((room) => room.level || 0))].sort((a, b) => a - b);

  const sheets = levels.map((level) => buildSheet({
    level,
    rooms: placed.filter((room) => (room.level || 0) === level),
    placed,
    walls,
    entrance,
    setup,
    validations,
    options,
  }));

  const totalM2 = placed.reduce((sum, room) => sum + room.width * room.length, 0);
  const errors = validations.filter((issue) => issue.severity === 'error');

  return {
    version: PLAN_MODEL_VERSION,
    unit: 'm',
    wallThickness: PLAN_WALL_THICKNESS,
    meta: {
      vivienda: setup.vivienda || 'piso',
      viviendaLabel: VIVIENDAS[setup.vivienda]?.label || 'Vivienda',
      totalM2,
      roomCount: placed.length,
      levelCount: sheets.length,
      notes: setup.notas || '',
      extras: Object.keys(setup.extras || {}).filter((key) => setup.extras[key]),
      status: errors.length ? 'invalid' : 'valid',
      generatedAt: options.dateStr || '',
    },
    validations,
    sheets,
  };
}

function buildSheet({ level, rooms, placed, walls, entrance, setup, validations }) {
  const xs = rooms.flatMap((room) => [room.cx - room.width / 2, room.cx + room.width / 2]);
  const ys = rooms.flatMap((room) => [room.cz - room.length / 2, room.cz + room.length / 2]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const sheet = {
    id: `sheet-${level}`,
    level,
    name: level === 0 ? 'Planta baja' : `Planta ${level}`,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
    rooms: [],
    walls: [],
    openings: [],
    fixtures: [],
    dimensions: [],
    legend: [],
    validations: validations.filter((issue) => issue.level === level),
  };

  rooms.forEach((room) => {
    const roomIndex = placed.findIndex((candidate) => candidate.id === room.id);
    const roomWalls = walls[roomIndex];
    const roomLabel = `${ROOM_TYPES[room.type]?.label || room.type} · ${(room.width * room.length).toFixed(1)} m²`;
    const roomBounds = roomBoundsFromCenter(room);
    const windows = !!room.services?.carpinteria?.on && !!room.services?.carpinteria?.ventanas;
    const legendServices = Object.entries(SERVICES)
      .filter(([key]) => room.services?.[key]?.on)
      .map(([, service]) => service.label);

    sheet.rooms.push({
      id: room.id,
      type: room.type,
      name: ROOM_TYPES[room.type]?.label || room.type,
      label: roomLabel,
      level: room.level || 0,
      area: room.width * room.length,
      center: { x: room.cx, y: room.cz },
      bounds: roomBounds,
      color: ROOM_TYPES[room.type]?.color || '#94a3b8',
    });

    sheet.dimensions.push(
      createDimension(room.id, 'horizontal', { x: roomBounds.minX, y: roomBounds.minY - 0.45 }, { x: roomBounds.maxX, y: roomBounds.minY - 0.45 }, `${room.width.toFixed(1)} m`),
      createDimension(room.id, 'vertical', { x: roomBounds.maxX + 0.45, y: roomBounds.minY }, { x: roomBounds.maxX + 0.45, y: roomBounds.maxY }, `${room.length.toFixed(1)} m`),
    );

    SIDES.forEach((side) => {
      const wall = roomWalls[side];
      const opening = getOpening(room, side, wall, {
        windows,
        entrance: entrance && entrance.roomId === room.id && entrance.side === side,
      });
      sheet.walls.push(createWallSegment(room, side, wall));
      if (opening) {
        sheet.openings.push(createOpening(room, side, wall, opening));
      }
    });

    resolveRoomFixtures(room).forEach((fixture) => {
      if (!showsInPlan(fixture.key)) return;
      const item = FURNITURE_BY_KEY[fixture.key];
      if (!item) return;
      const size = footprint(item, fixture.rot || 0);
      sheet.fixtures.push({
        roomId: room.id,
        key: fixture.key,
        label: item.label,
        center: { x: room.cx + (fixture.px || 0), y: room.cz + (fixture.pz || 0) },
        width: size.w,
        depth: size.d,
        rotation: fixture.rot || 0,
        layer: 'A-FURN',
      });
    });

    sheet.legend.push({
      roomId: room.id,
      title: ROOM_TYPES[room.type]?.label || room.type,
      subtitle: `${(room.width * room.length).toFixed(1)} m²`,
      lines: legendServices.length ? legendServices : ['Reforma general'],
    });
  });

  return sheet;
}

function validateRooms(rooms) {
  const validations = [];

  rooms.forEach((room) => {
    if (!(room.width > 0) || !(room.length > 0) || Number.isNaN(room.width) || Number.isNaN(room.length)) {
      validations.push({
        code: 'ROOM_INVALID_DIMENSIONS',
        severity: 'error',
        level: room.level || 0,
        roomId: room.id,
        message: `La zona ${ROOM_TYPES[room.type]?.label || room.type} tiene dimensiones no válidas.`,
      });
    }
  });

  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const a = rooms[i];
      const b = rooms[j];
      if ((a.level || 0) !== (b.level || 0)) continue;
      if (roomsOverlap(a, b)) {
        validations.push({
          code: 'ROOM_OVERLAP',
          severity: 'error',
          level: a.level || 0,
          roomIds: [a.id, b.id],
          message: `Hay solape entre ${ROOM_TYPES[a.type]?.label || a.type} y ${ROOM_TYPES[b.type]?.label || b.type}.`,
        });
      }
    }
  }

  return validations;
}

function roomsOverlap(a, b) {
  const ab = roomBoundsFromCenter(a);
  const bb = roomBoundsFromCenter(b);
  const overlapX = Math.min(ab.maxX, bb.maxX) - Math.max(ab.minX, bb.minX);
  const overlapY = Math.min(ab.maxY, bb.maxY) - Math.max(ab.minY, bb.minY);
  return overlapX > 0.02 && overlapY > 0.02;
}

function roomBoundsFromCenter(room) {
  return {
    minX: room.cx - room.width / 2,
    maxX: room.cx + room.width / 2,
    minY: room.cz - room.length / 2,
    maxY: room.cz + room.length / 2,
    width: room.width,
    height: room.length,
  };
}

function createDimension(roomId, orientation, start, end, text) {
  return { roomId, orientation, start, end, text, layer: 'A-DIMS' };
}

function createWallSegment(room, side, wall) {
  const { start, end } = wallEndpoints(room, side);
  return {
    roomId: room.id,
    side,
    type: wall.type,
    neighborId: wall.neighborId ?? null,
    start,
    end,
    thickness: PLAN_WALL_THICKNESS,
    layer: 'A-WALL',
  };
}

function createOpening(room, side, wall, opening) {
  const span = side === 'n' || side === 's' ? room.width : room.length;
  const width = resolveOpeningWidth(span, opening);
  const center = openingCenter(room, side, opening, width);
  const { start, end } = openingExtents(center, side, width);

  return {
    roomId: room.id,
    side,
    wallType: wall.type,
    kind: opening.kind,
    role: opening.role,
    hoja: opening.hoja,
    width,
    center,
    start,
    end,
    slide: opening.slide,
    layer: 'A-OPEN',
  };
}

function resolveOpeningWidth(span, opening) {
  if (opening.role === 'window') return Math.min(1.5, span * 0.55);
  return Math.min(opening.width || 0.9, Math.max(0.6, span - 0.2));
}

function openingCenter(room, side, opening, width) {
  const offset = opening.role === 'window' ? 0 : (opening.offset || 0);

  if (side === 'n') return { x: room.cx + offset, y: room.cz - room.length / 2 };
  if (side === 's') return { x: room.cx + offset, y: room.cz + room.length / 2 };
  if (side === 'w') return { x: room.cx - room.width / 2, y: room.cz + offset };
  return { x: room.cx + room.width / 2, y: room.cz + offset };
}

function openingExtents(center, side, width) {
  if (side === 'n' || side === 's') {
    return {
      start: { x: center.x - width / 2, y: center.y },
      end: { x: center.x + width / 2, y: center.y },
    };
  }

  return {
    start: { x: center.x, y: center.y - width / 2 },
    end: { x: center.x, y: center.y + width / 2 },
  };
}

function wallEndpoints(room, side) {
  const bounds = roomBoundsFromCenter(room);
  if (side === 'n') return { start: { x: bounds.minX, y: bounds.minY }, end: { x: bounds.maxX, y: bounds.minY } };
  if (side === 's') return { start: { x: bounds.minX, y: bounds.maxY }, end: { x: bounds.maxX, y: bounds.maxY } };
  if (side === 'w') return { start: { x: bounds.minX, y: bounds.minY }, end: { x: bounds.minX, y: bounds.maxY } };
  return { start: { x: bounds.maxX, y: bounds.minY }, end: { x: bounds.maxX, y: bounds.maxY } };
}

function resolveRoomFixtures(room) {
  if (Array.isArray(room.furniture) && room.furniture.length) return room.furniture;
  if (room.services?.mobiliario?.on) {
    return fittedAuto(room.type, room.width, room.length).map((fixture, index) => ({
      ...fixture,
      id: `auto-${room.id}-${index}`,
    }));
  }
  return [];
}
