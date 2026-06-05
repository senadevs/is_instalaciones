// ============================================================================
//  Generador de PLANO 2D (SVG) para adjuntar al presupuesto.
//  Dibuja zonas con cotas, puertas/ventanas, mobiliario y una leyenda con los
//  servicios por zona. Exportable a PNG. Sin estado: función pura de datos.
// ============================================================================

import { ROOM_TYPES, SERVICES, VIVIENDAS, EXTRAS, FINISHES, REFORMS } from './catalog.js';
import { placeRooms, computeWalls, getOpening, pickEntrance } from './geometry.js';

const PXM = 46;          // píxeles por metro
const PAD = 1.0;         // margen alrededor del plano (m)
const LEGEND_W = 340;    // ancho de la leyenda (px)
const HEAD = 70;         // alto de la cabecera (px)
const FOOT = 34;         // alto del pie (px)
const WALL = '#1f2937';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function buildPlanSVG(rooms, setup = {}, dateStr = '') {
  const placed = placeRooms(rooms);
  const walls = computeWalls(placed);
  const entrance = pickEntrance(placed, walls);

  const xs = placed.flatMap((r) => [r.cx - r.width / 2, r.cx + r.width / 2]);
  const zs = placed.flatMap((r) => [r.cz - r.length / 2, r.cz + r.length / 2]);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1);
  const minZ = Math.min(...zs, 0), maxZ = Math.max(...zs, 1);
  const levels = [...new Set(placed.map((r) => r.level || 0))].sort((a, b) => a - b);
  const spanX = maxX - minX, GAP = 1.5;
  const dxLevel = (lv) => levels.indexOf(lv) * (spanX + GAP);
  const planW = (spanX * levels.length + GAP * (levels.length - 1) + PAD * 2) * PXM;
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

  // Títulos de planta (si hay varias)
  if (levels.length > 1) {
    levels.forEach((lv) => {
      const cxpx = sx((minX + maxX) / 2 + dxLevel(lv));
      parts.push(`<text x="${cxpx.toFixed(1)}" y="16" text-anchor="middle" font-size="13" font-weight="700" fill="#334155">${lv === 0 ? 'Planta baja' : 'Planta ' + lv}</text>`);
    });
  }

  placed.forEach((r, i) => {
    const t = ROOM_TYPES[r.type];
    const dx = dxLevel(r.level || 0);
    const x = sx(r.cx - r.width / 2 + dx), y = sy(r.cz - r.length / 2);
    const w = r.width * PXM, h = r.length * PXM;
    // suelo
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${t.color}" fill-opacity="0.12" stroke="${WALL}" stroke-width="3"/>`);

    // puertas / ventanas: "corta" la pared y dibuja el símbolo según el tipo
    const windows = r.services?.carpinteria?.on && r.services.carpinteria.ventanas;
    const L = (x1, y1, x2, y2, col, sw, dash) => parts.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
    const Jamb = (px, py) => parts.push(`<rect x="${(px - 1.5).toFixed(1)}" y="${(py - 1.5).toFixed(1)}" width="3" height="3" fill="${WALL}"/>`);
    // Símbolo de puerta: hoja + arco de barrido (gozne en el origen del grupo).
    const swing = (gx, gy, rot, ow) => parts.push(`<g transform="translate(${gx.toFixed(1)} ${gy.toFixed(1)}) rotate(${rot})"><line x1="0" y1="0" x2="0" y2="${ow.toFixed(1)}" stroke="#475569" stroke-width="2"/><path d="M0 ${ow.toFixed(1)} A ${ow.toFixed(1)} ${ow.toFixed(1)} 0 0 1 ${ow.toFixed(1)} 0" fill="none" stroke="#94a3b8" stroke-width="1"/></g>`);
    ['n', 's', 'e', 'w'].forEach((side) => {
      const op = getOpening(r, side, walls[i][side], { windows, entrance: entrance && entrance.roomId === r.id && entrance.side === side });
      if (!op) return;
      const isWin = op.role === 'window';
      const horiz = side === 'n' || side === 's';
      const spanM = horiz ? r.width : r.length;
      const openW = (isWin ? Math.min(1.5, spanM * 0.55) : Math.min(op.width || 0.9, spanM - 0.2)) * PXM;
      const off = (isWin ? 0 : (op.offset || 0)) * PXM;
      const cx = sx(r.cx + dx), cy = sy(r.cz);
      // borde y vector hacia el interior
      let bx, by, ix, iy;
      if (side === 'n') { bx = cx + off; by = y; ix = 0; iy = 1; }
      else if (side === 's') { bx = cx + off; by = y + h; ix = 0; iy = -1; }
      else if (side === 'w') { bx = x; by = cy + off; ix = 1; iy = 0; }
      else { bx = x + w; by = cy + off; ix = -1; iy = 0; }
      // extremos del hueco a lo largo del borde
      const e1x = horiz ? bx - openW / 2 : bx, e1y = horiz ? by : by - openW / 2;
      const e2x = horiz ? bx + openW / 2 : bx, e2y = horiz ? by : by + openW / 2;
      // borra la pared en el hueco
      const gx = horiz ? bx - openW / 2 : bx - 3, gy = horiz ? by - 3 : by - openW / 2;
      parts.push(`<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${(horiz ? openW : 6).toFixed(1)}" height="${(horiz ? 6 : openW).toFixed(1)}" fill="#ffffff"/>`);

      if (isWin || op.hoja === 'cristal') {
        L(e1x, e1y, e2x, e2y, '#38bdf8', 2);
        if (isWin) L(e1x + ix * 3, e1y + iy * 3, e2x + ix * 3, e2y + iy * 3, '#7dd3fc', 1.5);
      } else if (op.kind === 'corredera') {
        Jamb(e1x, e1y); Jamb(e2x, e2y);
        L(e1x + ix * 5, e1y + iy * 5, e2x + ix * 5, e2y + iy * 5, '#64748b', 3); // hoja corrida
      } else if (op.role === 'open' || op.kind === 'arco' || op.kind === 'hueco') {
        Jamb(e1x, e1y); Jamb(e2x, e2y); // paso abierto, sin hoja
      } else {
        // batiente / doble / entrada: hoja + arco de barrido (símbolo de plano)
        Jamb(e1x, e1y); Jamb(e2x, e2y);
        const g = side === 'n' ? [e1x, e1y, 0] : side === 's' ? [e2x, e2y, 180] : side === 'e' ? [e1x, e1y, 90] : [e2x, e2y, -90];
        swing(g[0], g[1], g[2], openW);
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
    const lvTxt = levels.length > 1 ? ` · ${(r.level || 0) === 0 ? 'P.baja' : 'P.' + (r.level || 0)}` : '';
    parts.push(`<text x="${lx + 14}" y="${ly}" font-size="12" font-weight="600" fill="#1e293b">${esc(t.label)} · ${(r.width * r.length).toFixed(1)} m²${lvTxt}</text>`);
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

// Abre una página imprimible (plano + memoria explicativa) para guardar como
// PDF desde el navegador ("Imprimir → Guardar como PDF"). Sin dependencias.
export function openPlanPDF(rooms, setup = {}) {
  const date = new Date().toLocaleDateString('es-ES');
  const { svg } = buildPlanSVG(rooms, setup, date);
  const totalM2 = rooms.reduce((s, r) => s + r.width * r.length, 0);
  const multi = rooms.some((r) => (r.level || 0) > 0);

  const filas = rooms.map((r) => {
    const t = ROOM_TYPES[r.type];
    const svcs = Object.entries(SERVICES).filter(([k]) => r.services?.[k]?.on).map(([k, svc]) => {
      const chosen = svc.opts.filter((o) => r.services[k][o.key]).map((o) => esc(o.label));
      return `<li><b>${esc(svc.label)}</b>${chosen.length ? ': ' + chosen.join(', ') : ''}</li>`;
    }).join('');
    const lv = multi ? ` <span class="lv">${(r.level || 0) === 0 ? 'P. baja' : 'P. ' + (r.level || 0)}</span>` : '';
    const km = r.openKitchen ? '<li>Cocina americana</li>' : '';
    return `<tr><td><b>${esc(t.label)}</b>${lv}</td><td>${r.width}×${r.length} m<br><small>${(r.width * r.length).toFixed(1)} m²</small></td><td>${esc(REFORMS[r.reform] || '')}<br><small>${esc(FINISHES[r.finish] || '')}</small></td><td><ul>${svcs || '<li>reforma general</li>'}${km}</ul></td></tr>`;
  }).join('');

  const extras = EXTRAS.filter((e) => setup.extras?.[e.key]).map((e) => esc(e.label));
  const notas = setup.notas ? `<h2>Notas</h2><p>${esc(setup.notas)}</p>` : '';

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Plano de reforma · IS Instalaciones</title>
<style>
  *{box-sizing:border-box} body{font-family:system-ui,Segoe UI,sans-serif;color:#0f172a;margin:0;padding:28px;}
  h1{color:#046a53;margin:0 0 2px;font-size:22px} .sub{color:#64748b;font-size:13px;margin:0 0 16px}
  .plano{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px} .plano svg{width:100%;height:auto;display:block}
  h2{font-size:15px;color:#046a53;border-bottom:2px solid #e2e8f0;padding-bottom:4px;margin:18px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:12px} th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid #eef2f6}
  th{background:#f8fafc;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
  ul{margin:0;padding-left:16px} small{color:#64748b} .lv{background:#ecfdf5;color:#046a53;border-radius:4px;padding:1px 5px;font-size:10px}
  .foot{margin-top:20px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:0}.noprint{display:none}}
</style></head><body>
  <h1>Plano de reforma</h1>
  <p class="sub">${esc(VIVIENDAS[setup.vivienda]?.label || 'Vivienda')} · ${rooms.length} zonas · ${totalM2.toFixed(1)} m² · ${esc(date)}</p>
  <div class="plano">${svg}</div>
  <h2>Detalle por zona y servicios</h2>
  <table><thead><tr><th>Zona</th><th>Medidas</th><th>Reforma</th><th>Servicios</th></tr></thead><tbody>${filas}</tbody></table>
  ${extras.length ? `<h2>Extras del inmueble</h2><p>${extras.join(', ')}</p>` : ''}
  ${notas}
  <p class="foot">Plano y memoria orientativos generados con el configurador 3D de IS Instalaciones. No constituye proyecto técnico. Presupuesto sujeto a visita técnica.</p>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);};</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
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
