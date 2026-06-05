// ============================================================================
//  Geometría pura del estimador: disposición de estancias, detección de
//  paredes contiguas/compartidas, aperturas (puertas/ventanas) y colisiones
//  AABB para validar el drag&drop de mobiliario. Sin dependencias externas.
// ============================================================================

import { DOOR_KINDS, WINDOW_KINDS, FURNITURE_BY_KEY, autoFurnish } from './catalog.js';

// Construye la apertura de una ventana según su subtipo.
function windowOpening(winKind) {
  const def = WINDOW_KINDS[winKind] || WINDOW_KINDS.fija;
  return { kind: 'window', winKind, role: 'window', hoja: 'cristal', bottom: def.bottom, top: def.top, slide: !!def.slide };
}

const EPS = 0.06; // tolerancia para considerar dos paredes pegadas (m)

// Auto-distribuye en filas un grupo de estancias (de una misma planta), con la
// esquina anclada en el origen. Respeta las que traen cx/cz manual (drag).
function layoutGroupCorner(rooms) {
  const maxRow = 13;
  let x = 0, z = 0, rowDepth = 0;
  return rooms.map((r) => {
    if (typeof r.cx === 'number' && typeof r.cz === 'number') return { ...r, manual: true };
    if (x + r.width > maxRow && x > 0) { x = 0; z += rowDepth; rowDepth = 0; }
    const cx = x + r.width / 2, cz = z + r.length / 2;
    x += r.width; rowDepth = Math.max(rowDepth, r.length);
    return { ...r, cx, cz, manual: false };
  });
}

// ---- Disposición de estancias (multi-planta, plantas alineadas) ------------
// Cada planta se distribuye anclada al mismo origen y se centra TODO con el
// mismo desplazamiento (el de la planta baja), de modo que las plantas encajan
// una sobre otra (en 3D se apilan en Y; en plano se separan por nivel).
export function placeRooms(rooms) {
  const levels = [...new Set(rooms.map((r) => r.level || 0))].sort((a, b) => a - b);
  const all = levels.flatMap((lv) => layoutGroupCorner(rooms.filter((r) => (r.level || 0) === lv)));
  const base = all.filter((r) => (r.level || 0) === 0 && !r.manual);
  const ref = base.length ? base : all.filter((r) => !r.manual);
  if (ref.length) {
    const maxX = Math.max(...ref.map((r) => r.cx + r.width / 2));
    const maxZ = Math.max(...ref.map((r) => r.cz + r.length / 2));
    all.forEach((r) => { if (!r.manual) { r.cx -= maxX / 2; r.cz -= maxZ / 2; } });
  }
  return all;
}

// Bordes de una estancia en mundo.
function edges(r) {
  return {
    L: r.cx - r.width / 2, R: r.cx + r.width / 2,
    N: r.cz - r.length / 2, S: r.cz + r.length / 2,
  };
}

// ---- Paredes: interior (vecina) o exterior + datos del vecino ---------------
// Devuelve, por estancia, un objeto { n,s,e,w } con { type, neighborId, neighborType }.
export function computeWalls(placed) {
  return placed.map((a, i) => {
    const wall = {
      n: { type: 'ext' }, s: { type: 'ext' },
      e: { type: 'ext' }, w: { type: 'ext' },
    };
    const A = edges(a);
    placed.forEach((b, j) => {
      if (i === j) return;
      if ((a.level || 0) !== (b.level || 0)) return; // solo paredes del mismo nivel
      const B = edges(b);
      const zOv = Math.min(A.S, B.S) - Math.max(A.N, B.N) > 0.5;
      const xOv = Math.min(A.R, B.R) - Math.max(A.L, B.L) > 0.5;
      // Centro (en mundo) del tramo común, para alinear la puerta en ambas zonas.
      const midZ = (Math.max(A.N, B.N) + Math.min(A.S, B.S)) / 2;
      const midX = (Math.max(A.L, B.L) + Math.min(A.R, B.R)) / 2;
      const m = (mid) => ({ type: 'int', neighborId: b.id, neighborType: b.type, mid });
      if (Math.abs(A.R - B.L) < EPS && zOv) wall.e = m(midZ);
      if (Math.abs(A.L - B.R) < EPS && zOv) wall.w = m(midZ);
      if (Math.abs(A.S - B.N) < EPS && xOv) wall.s = m(midX);
      if (Math.abs(A.N - B.S) < EPS && xOv) wall.n = m(midX);
    });
    return wall;
  });
}

// ---- Apertura de una pared (puerta / ventana / hueco) -----------------------
// Decide qué dibujar en cada pared según: override del usuario (room.openings),
// si es interior/exterior, cocina americana, y si hay ventanas activas.
// Offset del hueco a lo largo de la pared. En paredes compartidas usa el centro
// del tramo común (puertas alineadas en ambas zonas); en exteriores evita
// muebles. Siempre acotado para que el hueco quepa en la pared.
function alignedOffset(room, side, wall, openW) {
  const horiz = side === 'n' || side === 's';
  const span = horiz ? room.width : room.length;
  const lim = span / 2 - openW / 2 - 0.05;
  if (lim <= 0) return 0;
  if (wall && typeof wall.mid === 'number') {
    const center = horiz ? room.cx : room.cz;
    return Math.max(-lim, Math.min(lim, wall.mid - center));
  }
  return doorOffset(room, side, openW);
}

export function getOpening(room, side, wall, opts = {}) {
  const override = room.openings && room.openings[side];
  if (override) {
    if (override.kind === 'none') return null;
    if (override.kind === 'window') return windowOpening('fija');
    if (override.kind.startsWith('win:')) return windowOpening(override.kind.slice(4));
    const k = DOOR_KINDS[override.kind] || DOOR_KINDS.batiente;
    const w = override.width || k.w;
    return { kind: override.kind, width: w, hoja: k.hoja, role: 'door', offset: alignedOffset(room, side, wall, w) };
  }

  // Cocina americana: pared compartida cocina <-> salón/comedor => hueco grande.
  const openTypes = ['salon', 'comedor', 'cocina'];
  if (wall.type === 'int' && room.openKitchen &&
      (room.type === 'cocina' || wall.neighborType === 'cocina') &&
      openTypes.includes(room.type) && openTypes.includes(wall.neighborType)) {
    const w = DOOR_KINDS.hueco.w;
    return { kind: 'hueco', width: w, hoja: 'none', role: 'open', offset: alignedOffset(room, side, wall, w) };
  }

  // Entrada principal forzada.
  if (opts.entrance) {
    return { kind: 'entrance', width: 1.0, hoja: 'panel', role: 'entrance', offset: alignedOffset(room, side, wall, 1.0) };
  }

  // Pared interior por defecto: puerta de paso batiente.
  if (wall.type === 'int') {
    const k = DOOR_KINDS.batiente;
    return { kind: 'batiente', width: k.w, hoja: 'panel', role: 'door', offset: alignedOffset(room, side, wall, k.w) };
  }

  // Pared exterior con ventanas activas: ventana fija por defecto.
  if (wall.type === 'ext' && opts.windows) {
    return windowOpening('fija');
  }
  return null;
}

// Posición (offset a lo largo de la pared) para una puerta, evitando el
// mobiliario pegado a esa pared. Prefiere el centro y se desplaza si choca.
export function doorOffset(room, side, openW) {
  const horiz = side === 'n' || side === 's';      // el hueco corre en X local
  const span = horiz ? room.width : room.length;
  const limit = span / 2 - openW / 2 - 0.1;
  if (limit <= 0) return 0;
  // Borde (coordenada perpendicular) de esta pared.
  const borderPerp = horiz
    ? (side === 'n' ? -room.length / 2 : room.length / 2)
    : (side === 'w' ? -room.width / 2 : room.width / 2);
  // Muebles pegados a esta pared y su rango ocupado a lo largo del eje del hueco.
  const blockers = (room.furniture || []).map((f) => {
    const c = FURNITURE_BY_KEY[f.key] || { w: 0.5, d: 0.5 };
    const fp = footprint(c, f.rot || 0);
    const axisPos = horiz ? f.px : f.pz;
    const perpPos = horiz ? f.pz : f.px;
    const axisExt = horiz ? fp.w / 2 : fp.d / 2;
    const perpExt = horiz ? fp.d / 2 : fp.w / 2;
    return { axisPos, axisExt, near: Math.abs(perpPos - borderPerp) < perpExt + 0.55 };
  }).filter((b) => b.near);
  const free = (off) => blockers.every((b) => Math.abs(off - b.axisPos) >= openW / 2 + b.axisExt + 0.05);
  for (let d = 0; d <= limit + 0.001; d += 0.25) {
    if (free(d)) return Math.min(limit, d);
    if (free(-d)) return Math.max(-limit, -d);
  }
  return 0;
}

// ---- Escalado por superficie y ayudas de colocación ------------------------
// Escala proporcionalmente las zonas para que su suma ≈ targetM2 y resetea la
// posición para que se re-distribuyan. El usuario luego refina cada una.
export function scaleRoomsToArea(rooms, targetM2) {
  const cur = rooms.reduce((s, r) => s + r.width * r.length, 0);
  if (!cur || !targetM2) return rooms;
  const f = Math.sqrt(targetM2 / cur);
  const round = (v) => Math.max(1, Math.round(v * f * 2) / 2);
  return rooms.map(({ cx, cz, ...r }) => ({ ...r, width: round(r.width), length: round(r.length) }));
}

// Imanta el mueble a las paredes cercanas (queda al ras) y lo mantiene dentro.
export function snapToWalls(room, item, x, z, rot, thr = 0.35) {
  const fp = footprint(item, rot);
  const margin = 0.04;
  const maxX = room.width / 2 - fp.w / 2 - margin;
  const maxZ = room.length / 2 - fp.d / 2 - margin;
  let nx = x, nz = z;
  if (Math.abs(x + maxX) < thr) nx = -maxX; else if (Math.abs(x - maxX) < thr) nx = maxX;
  if (Math.abs(z + maxZ) < thr) nz = -maxZ; else if (Math.abs(z - maxZ) < thr) nz = maxZ;
  return { x: Math.max(-maxX, Math.min(maxX, nx)), z: Math.max(-maxZ, Math.min(maxZ, nz)) };
}

// Auto-amueblado AJUSTADO: descarta lo que no cabe y mete dentro de los muros
// lo que se saldría (para que ningún elemento quede fuera de la zona).
export function fittedAuto(type, w, l) {
  return autoFurnish(type, w, l)
    .filter((f) => {
      const c = FURNITURE_BY_KEY[f.key]; if (!c) return false;
      const fp = footprint(c, f.rot || 0);
      return fp.w <= w - 0.1 && fp.d <= l - 0.1;
    })
    .map((f) => {
      const c = FURNITURE_BY_KEY[f.key];
      const fp = footprint(c, f.rot || 0);
      const mx = Math.max(0, w / 2 - fp.w / 2 - 0.05);
      const mz = Math.max(0, l / 2 - fp.d / 2 - 0.05);
      return { ...f, px: Math.max(-mx, Math.min(mx, f.px)), pz: Math.max(-mz, Math.min(mz, f.pz)) };
    });
}

// Libera el hueco de una puerta: mueve a un sitio libre (o quita) los muebles
// que invaden el paso. Devuelve la nueva lista de furniture de la estancia.
export function clearDoorway(room, side, opening) {
  const items = room.furniture || [];
  if (!opening || opening.role === 'window') return items;
  const horiz = side === 'n' || side === 's';
  const span = horiz ? room.width : room.length;
  const openW = Math.min(opening.width || 0.9, span - 0.2);
  const off = opening.offset || 0;
  const borderPerp = horiz
    ? (side === 'n' ? -room.length / 2 : room.length / 2)
    : (side === 'w' ? -room.width / 2 : room.width / 2);
  const depth = 0.6; // banda de paso frente a la puerta
  const kept = [], relocate = [];
  items.forEach((f) => {
    const c = FURNITURE_BY_KEY[f.key]; if (!c) { kept.push(f); return; }
    const fp = footprint(c, f.rot || 0);
    const axisPos = horiz ? f.px : f.pz, perpPos = horiz ? f.pz : f.px;
    const axisExt = horiz ? fp.w / 2 : fp.d / 2, perpExt = horiz ? fp.d / 2 : fp.w / 2;
    const blocks = Math.abs(axisPos - off) < openW / 2 + axisExt && Math.abs(perpPos - borderPerp) < perpExt + depth;
    (blocks ? relocate : kept).push(f);
  });
  relocate.forEach((f) => {
    const c = FURNITURE_BY_KEY[f.key];
    const others = kept.map((k) => { const kc = FURNITURE_BY_KEY[k.key] || { w: 0.5, d: 0.5 }; return { ...k, w: kc.w, d: kc.d }; });
    const spot = findFreeSpot(room, c, others);
    if (spot) kept.push({ ...f, px: spot.x, pz: spot.z }); // si no hay hueco, se quita
  });
  return kept;
}

// Holguras (m) del mueble a cada pared, para mostrar el espacio que queda.
export function clearances(room, item, x, z, rot) {
  const fp = footprint(item, rot);
  return {
    izq: (x - fp.w / 2) + room.width / 2,
    der: room.width / 2 - (x + fp.w / 2),
    fondo: (z - fp.d / 2) + room.length / 2,
    frente: room.length / 2 - (z + fp.d / 2),
  };
}

// ---- Entrada principal (puerta exterior) ------------------------------------
export function pickEntrance(placed, walls) {
  const pref = ['recibidor', 'pasillo', 'salon', 'comedor'];
  let best = null;
  placed.forEach((r, i) => {
    if ((r.level || 0) !== 0) return; // la entrada principal está en planta baja
    ['s', 'n', 'e', 'w'].forEach((side) => {
      if (walls[i][side].type !== 'ext') return;
      const score = (pref.indexOf(r.type) + 1 || 9) * 10 + (side === 's' ? 0 : 5);
      if (!best || score < best.score) best = { roomId: r.id, side, score };
    });
  });
  return best;
}

// ---- Colisiones AABB para el mobiliario -------------------------------------
// rot en radianes (múltiplos de 90º) intercambia ancho/fondo.
export function footprint(item, rot = 0) {
  const swap = Math.round(Math.abs(rot) / (Math.PI / 2)) % 2 === 1;
  return swap ? { w: item.d, d: item.w } : { w: item.w, d: item.d };
}

function overlap(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 0.02 &&
         Math.abs(a.z - b.z) < (a.d + b.d) / 2 - 0.02;
}

// ¿Cabe el mueble en (x,z) dentro de la estancia y sin pisar a otros?
// x,z en coordenadas LOCALES de la estancia (centro en 0,0).
export function furnitureFits(room, item, x, z, rot, others = [], ignoreId = null) {
  const margin = 0.05;
  const fp = footprint(item, rot);
  // Dentro de los muros.
  if (Math.abs(x) + fp.w / 2 > room.width / 2 - margin) return false;
  if (Math.abs(z) + fp.d / 2 > room.length / 2 - margin) return false;
  // Sin solapar otros muebles.
  const me = { x, z, w: fp.w, d: fp.d };
  for (const o of others) {
    if (o.id === ignoreId) continue;
    const ofp = footprint(o, o.rot || 0);
    if (overlap(me, { x: o.px, z: o.pz, w: ofp.w, d: ofp.d })) return false;
  }
  return true;
}

// Busca un hueco libre para colocar un mueble nuevo (rejilla simple).
export function findFreeSpot(room, item, others = []) {
  const step = 0.4;
  const fp = footprint(item, 0);
  const xMax = room.width / 2 - fp.w / 2 - 0.05;
  const zMax = room.length / 2 - fp.d / 2 - 0.05;
  if (xMax < 0 || zMax < 0) return null; // no cabe ni vacío
  for (let z = -zMax; z <= zMax; z += step) {
    for (let x = -xMax; x <= xMax; x += step) {
      if (furnitureFits(room, item, x, z, 0, others)) return { x, z };
    }
  }
  return null;
}
