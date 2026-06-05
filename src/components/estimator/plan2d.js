// ============================================================================
//  Generador de PLANO 2D (SVG) para adjuntar al presupuesto.
//  Dibuja zonas con cotas, puertas/ventanas, mobiliario y una leyenda con los
//  servicios por zona. Exportable a PNG. Sin estado: función pura de datos.
// ============================================================================

import { ROOM_TYPES, SERVICES, VIVIENDAS, EXTRAS, FURNITURE_BY_KEY, autoFurnish } from './catalog.js';
import { placeRooms, computeWalls, getOpening, pickEntrance, footprint } from './geometry.js';

const PXM = 46;          // píxeles por metro
const PAD = 1.0;         // margen alrededor del plano (m)
const LEGEND_W = 340;    // ancho de la leyenda (px)
const HEAD = 70;         // alto de la cabecera (px)
const FOOT = 34;         // alto del pie (px)
const WALL = '#1f2937';
const CAT_COLOR = { salon: '#10b981', comedor: '#14b8a6', dormitorio: '#8b5cf6', cocina: '#f97316', bano: '#3b82f6', oficina: '#0ea5e9', luz: '#eab308', deco: '#94a3b8' };

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function buildPlanSVG(rooms, setup = {}, dateStr = '') {
  const placed = placeRooms(rooms);
  const walls = computeWalls(placed);
  const entrance = pickEntrance(placed, walls);

  const xs = placed.flatMap((r) => [r.cx - r.width / 2, r.cx + r.width / 2]);
  const zs = placed.flatMap((r) => [r.cz - r.length / 2, r.cz + r.length / 2]);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1);
  const minZ = Math.min(...zs, 0), maxZ = Math.max(...zs, 1);
  const planW = (maxX - minX + PAD * 2) * PXM;
  const planH = (maxZ - minZ + PAD * 2) * PXM;

  const sx = (x) => (x - minX + PAD) * PXM;
  const sy = (z) => (z - minZ + PAD) * PXM;

  const totalM2 = rooms.reduce((s, r) => s + r.width * r.length, 0);
  const width = Math.round(planW + LEGEND_W);
  const height = Math.round(Math.max(planH, 380) + HEAD + FOOT);
  const planTop = HEAD;

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui,Segoe UI,sans-serif">`);
  parts.push(`<rect width="${width}" height="${height}" fill="#ffffff"/>`);

  // Cabecera
  parts.push(`<rect x="0" y="0" width="${width}" height="${HEAD}" fill="#046a53"/>`);
  parts.push(`<text x="20" y="30" fill="#ffffff" font-size="20" font-weight="700">IS Instalaciones · Plano de reforma</text>`);
  parts.push(`<text x="20" y="52" fill="#d1fae5" font-size="13">${esc(VIVIENDAS[setup.vivienda]?.label || 'Vivienda')} · ${rooms.length} zonas · ${totalM2.toFixed(1)} m²${dateStr ? ' · ' + esc(dateStr) : ''}</text>`);

  // Área del plano
  parts.push(`<g transform="translate(0 ${planTop})">`);

  placed.forEach((r, i) => {
    const t = ROOM_TYPES[r.type];
    const x = sx(r.cx - r.width / 2), y = sy(r.cz - r.length / 2);
    const w = r.width * PXM, h = r.length * PXM;
    // suelo
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${t.color}" fill-opacity="0.12" stroke="${WALL}" stroke-width="3"/>`);

    // mobiliario (manual o auto-amueblado)
    const furn = (r.furniture && r.furniture.length)
      ? r.furniture
      : (r.services?.mobiliario?.on ? autoFurnish(r.type, r.width, r.length) : []);
    furn.forEach((f) => {
      const c = FURNITURE_BY_KEY[f.key]; if (!c) return;
      const fp = footprint(c, f.rot || 0);
      const cxpx = sx(r.cx + (f.px || 0)), cypx = sy(r.cz + (f.pz || 0));
      const fw = fp.w * PXM, fh = fp.d * PXM;
      parts.push(`<rect x="${(cxpx - fw / 2).toFixed(1)}" y="${(cypx - fh / 2).toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="2" fill="${CAT_COLOR[c.cat] || '#94a3b8'}" fill-opacity="0.6" stroke="#475569" stroke-width="0.8"/>`);
    });

    // puertas / ventanas: "corta" la pared y marca el hueco
    const windows = r.services?.carpinteria?.on && r.services.carpinteria.ventanas;
    ['n', 's', 'e', 'w'].forEach((side) => {
      const op = getOpening(r, side, walls[i][side], { windows, entrance: entrance && entrance.roomId === r.id && entrance.side === side });
      if (!op) return;
      const isWin = op.role === 'window';
      const openW = (isWin ? Math.min(1.5, (side === 'n' || side === 's' ? r.width : r.length) * 0.55) : Math.min(op.width || 0.9, (side === 'n' || side === 's' ? r.width : r.length) - 0.2)) * PXM;
      const off = (isWin ? 0 : (op.offset || 0)) * PXM;
      const cx = sx(r.cx), cy = sy(r.cz);
      let gx, gy, gw, gh;
      if (side === 'n') { gx = cx + off - openW / 2; gy = y - 3; gw = openW; gh = 6; }
      else if (side === 's') { gx = cx + off - openW / 2; gy = y + h - 3; gw = openW; gh = 6; }
      else if (side === 'w') { gx = x - 3; gy = cy + off - openW / 2; gw = 6; gh = openW; }
      else { gx = x + w - 3; gy = cy + off - openW / 2; gw = 6; gh = openW; }
      // borra la pared en el hueco
      parts.push(`<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${gw.toFixed(1)}" height="${gh.toFixed(1)}" fill="#ffffff"/>`);
      if (isWin) {
        // ventana: línea azul a lo largo del hueco
        if (side === 'n' || side === 's') parts.push(`<line x1="${gx.toFixed(1)}" y1="${(gy + gh / 2).toFixed(1)}" x2="${(gx + gw).toFixed(1)}" y2="${(gy + gh / 2).toFixed(1)}" stroke="#38bdf8" stroke-width="2"/>`);
        else parts.push(`<line x1="${(gx + gw / 2).toFixed(1)}" y1="${gy.toFixed(1)}" x2="${(gx + gw / 2).toFixed(1)}" y2="${(gy + gh).toFixed(1)}" stroke="#38bdf8" stroke-width="2"/>`);
      } else {
        // jambas de la puerta
        parts.push(`<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${(side === 'n' || side === 's' ? 2 : gw).toFixed(1)}" height="${(side === 'n' || side === 's' ? gh : 2).toFixed(1)}" fill="${WALL}"/>`);
        parts.push(`<rect x="${(side === 'n' || side === 's' ? gx + gw - 2 : gx).toFixed(1)}" y="${(side === 'n' || side === 's' ? gy : gy + gh - 2).toFixed(1)}" width="${(side === 'n' || side === 's' ? 2 : gw).toFixed(1)}" height="${(side === 'n' || side === 's' ? gh : 2).toFixed(1)}" fill="${WALL}"/>`);
      }
    });

    // etiqueta de zona: nombre + m² + dimensiones
    parts.push(`<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 - 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">${esc(t.label)}</text>`);
    parts.push(`<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 + 12).toFixed(1)}" text-anchor="middle" font-size="11" fill="#475569">${(r.width * r.length).toFixed(1)} m² · ${r.width}×${r.length} m</text>`);
  });

  parts.push(`</g>`); // fin área plano

  // Leyenda (servicios por zona)
  const lx = planW + 16;
  parts.push(`<line x1="${planW.toFixed(1)}" y1="${HEAD}" x2="${planW.toFixed(1)}" y2="${height - FOOT}" stroke="#e2e8f0" stroke-width="1"/>`);
  let ly = HEAD + 26;
  parts.push(`<text x="${lx}" y="${ly}" font-size="14" font-weight="700" fill="#0f172a">Servicios por zona</text>`);
  ly += 22;
  rooms.forEach((r) => {
    const t = ROOM_TYPES[r.type];
    const svcs = Object.entries(SERVICES).filter(([k]) => r.services?.[k]?.on).map(([, s]) => s.label);
    parts.push(`<circle cx="${lx + 4}" cy="${ly - 4}" r="4" fill="${t.color}"/>`);
    parts.push(`<text x="${lx + 14}" y="${ly}" font-size="12" font-weight="600" fill="#1e293b">${esc(t.label)} · ${(r.width * r.length).toFixed(1)} m²</text>`);
    ly += 16;
    const line = svcs.length ? svcs.join(', ') : 'reforma general';
    parts.push(`<text x="${lx + 14}" y="${ly}" font-size="10.5" fill="#64748b">${esc(line.length > 46 ? line.slice(0, 45) + '…' : line)}</text>`);
    if (r.openKitchen) { ly += 13; parts.push(`<text x="${lx + 14}" y="${ly}" font-size="10.5" fill="#f97316">Cocina americana</text>`); }
    ly += 20;
  });
  const ex = EXTRAS.filter((e) => setup.extras?.[e.key]).map((e) => e.label);
  if (ex.length) {
    ly += 6;
    parts.push(`<text x="${lx}" y="${ly}" font-size="12" font-weight="700" fill="#0f172a">Extras</text>`);
    ly += 16;
    parts.push(`<text x="${lx}" y="${ly}" font-size="10.5" fill="#64748b">${esc(ex.join(', '))}</text>`);
  }

  // Pie
  parts.push(`<text x="20" y="${height - 12}" font-size="11" fill="#94a3b8">Plano orientativo generado con el configurador 3D · IS Instalaciones · no constituye proyecto técnico</text>`);

  parts.push(`</svg>`);
  return { svg: parts.join(''), width, height };
}

// Rasteriza el SVG a PNG y dispara la descarga (solo cliente).
export function downloadPlanPNG(rooms, setup, filename = 'plano-reforma.png') {
  const date = new Date().toLocaleDateString('es-ES');
  const { svg, width, height } = buildPlanSVG(rooms, setup, date);
  const scale = 2;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = width * scale; c.height = height * scale;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
