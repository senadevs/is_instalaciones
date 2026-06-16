import {
  DEFAULT_SERVICES,
  ROOM_TYPES,
  SERVICES,
  templateFor,
} from './catalog.js';

let uid = 0;

export function buildServices(type) {
  const active = DEFAULT_SERVICES[type] || DEFAULT_SERVICES.default;
  const out = {};
  for (const [key, service] of Object.entries(SERVICES)) {
    const on = active.includes(key);
    const value = { on };
    service.opts.forEach((option) => {
      value[option.key] = on && !!option.default;
    });
    out[key] = value;
  }
  return out;
}

export function newRoom(type, level = 0) {
  const defaults = ROOM_TYPES[type].def;
  return {
    id: ++uid,
    type,
    level,
    width: defaults[0],
    length: defaults[1],
    height: 2.6,
    reform: 'integral',
    finish: 'medio',
    paint: '#f1f5f9',
    led: '#fff7cc',
    openKitchen: false,
    openings: {},
    furniture: [],
    services: buildServices(type),
  };
}

export function makeRooms(vivienda) {
  const rooms = [];
  templateFor(vivienda).forEach((zones, level) => {
    zones.forEach((type) => rooms.push(newRoom(type, level)));
  });
  return rooms;
}

export function createDefaultEstimatorState(vivienda = 'piso') {
  return {
    setup: { vivienda, m2: 80, notas: '', extras: {} },
    rooms: makeRooms(vivienda),
    selectedId: null,
    interior: null,
    addType: 'dormitorio',
    view: 'plan',
    insideItem: '',
    activeLevel: 0,
  };
}

export function normalizeEstimatorDraft(draft) {
  const fallback = createDefaultEstimatorState();
  if (!draft || typeof draft !== 'object') return fallback;

  const normalized = {
    setup: { ...fallback.setup, ...(draft.setup || {}) },
    rooms: Array.isArray(draft.rooms) && draft.rooms.length ? draft.rooms : fallback.rooms,
    selectedId: draft.selectedId ?? null,
    interior: draft.interior ?? null,
    addType: draft.addType || fallback.addType,
    view: draft.view || fallback.view,
    insideItem: draft.insideItem || '',
    activeLevel: draft.activeLevel ?? 0,
  };

  syncRoomIdSeed(normalized.rooms);
  return normalized;
}

export function syncRoomIdSeed(rooms) {
  const maxId = (rooms || []).reduce((max, room) => (
    typeof room.id === 'number' && room.id > max ? room.id : max
  ), 0);
  uid = Math.max(uid, maxId);
}
