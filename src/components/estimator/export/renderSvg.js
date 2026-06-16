const PX_PER_METER = 72;
const PAGE_PAD = 28;
const HEADER_H = 64;
const LEGEND_W = 240;

export function renderPlanSvg(model, options = {}) {
  const sheet = selectSheet(model, options);
  if (!sheet) return { svg: '', width: 0, height: 0 };

  const width = Math.max(640, Math.round(sheet.bounds.width * PX_PER_METER + PAGE_PAD * 2 + LEGEND_W));
  const height = Math.max(460, Math.round(sheet.bounds.height * PX_PER_METER + PAGE_PAD * 2 + HEADER_H));
  const minX = sheet.bounds.minX;
  const minY = sheet.bounds.minY;

  const toX = (x) => PAGE_PAD + (x - minX) * PX_PER_METER;
  const toY = (y) => HEADER_H + PAGE_PAD + (y - minY) * PX_PER_METER;
  const roomById = new Map(sheet.rooms.map((room) => [room.id, room]));
  const walls = uniqueSegments(sheet.walls);
  const openings = uniqueOpenings(sheet.openings);

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Inter,Segoe UI,sans-serif">`);
  parts.push('<rect width="100%" height="100%" fill="#fffdf8"/>');
  parts.push(`<rect width="${width}" height="${HEADER_H}" fill="#0f766e"/>`);
  parts.push(`<text x="${PAGE_PAD}" y="28" font-size="20" font-weight="700" fill="#ffffff">IS Instalaciones · ${escapeHtml(sheet.name)}</text>`);
  parts.push(`<text x="${PAGE_PAD}" y="48" font-size="12" fill="#ccfbf1">${escapeHtml(model.meta.viviendaLabel)} · ${model.meta.totalM2.toFixed(1)} m² · ${model.meta.roomCount} zonas</text>`);

  parts.push(`<g data-layer="A-LEVEL"><text x="${PAGE_PAD}" y="${HEADER_H + 18}" font-size="13" font-weight="600" fill="#134e4a">${escapeHtml(sheet.name)}</text></g>`);

  parts.push('<g data-layer="A-ROOM">');
  sheet.rooms.forEach((room) => {
    const x = toX(room.bounds.minX);
    const y = toY(room.bounds.minY);
    const w = room.bounds.width * PX_PER_METER;
    const h = room.bounds.height * PX_PER_METER;
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${room.color}" fill-opacity="0.10" rx="4"/>`);
  });
  parts.push('</g>');

  parts.push('<g data-layer="A-WALL" stroke="#1f2937" stroke-width="6" stroke-linecap="square">');
  walls.forEach((wall) => {
    const segments = subtractOpeningSegments(wall, openings);
    segments.forEach((segment) => {
      parts.push(`<line x1="${toX(segment.start.x).toFixed(1)}" y1="${toY(segment.start.y).toFixed(1)}" x2="${toX(segment.end.x).toFixed(1)}" y2="${toY(segment.end.y).toFixed(1)}"/>`);
    });
  });
  parts.push('</g>');

  parts.push('<g data-layer="A-OPEN" fill="none" stroke="#475569" stroke-width="2">');
  openings.forEach((opening) => {
    if (opening.role === 'window' || opening.hoja === 'cristal') {
      parts.push(`<line x1="${toX(opening.start.x).toFixed(1)}" y1="${toY(opening.start.y).toFixed(1)}" x2="${toX(opening.end.x).toFixed(1)}" y2="${toY(opening.end.y).toFixed(1)}" stroke="#0ea5e9"/>`);
      const offset = opening.side === 'n' || opening.side === 's'
        ? { x: 0, y: opening.side === 'n' ? 6 : -6 }
        : { x: opening.side === 'w' ? 6 : -6, y: 0 };
      parts.push(`<line x1="${(toX(opening.start.x) + offset.x).toFixed(1)}" y1="${(toY(opening.start.y) + offset.y).toFixed(1)}" x2="${(toX(opening.end.x) + offset.x).toFixed(1)}" y2="${(toY(opening.end.y) + offset.y).toFixed(1)}" stroke="#7dd3fc"/>`);
      return;
    }

    if (opening.kind === 'corredera') {
      parts.push(`<line x1="${toX(opening.start.x).toFixed(1)}" y1="${toY(opening.start.y).toFixed(1)}" x2="${toX(opening.end.x).toFixed(1)}" y2="${toY(opening.end.y).toFixed(1)}" stroke="#64748b"/>`);
      return;
    }

    if (opening.role === 'open' || opening.kind === 'arco' || opening.kind === 'hueco') {
      parts.push(`<line x1="${toX(opening.start.x).toFixed(1)}" y1="${toY(opening.start.y).toFixed(1)}" x2="${toX(opening.end.x).toFixed(1)}" y2="${toY(opening.end.y).toFixed(1)}" stroke="#94a3b8" stroke-dasharray="6 4"/>`);
      return;
    }

    const radius = opening.width * PX_PER_METER;
    if (opening.side === 'n') {
      parts.push(`<path d="M ${toX(opening.start.x).toFixed(1)} ${toY(opening.start.y).toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${toX(opening.end.x).toFixed(1)} ${(toY(opening.end.y) + radius).toFixed(1)}" stroke="#94a3b8"/>`);
    } else if (opening.side === 's') {
      parts.push(`<path d="M ${toX(opening.end.x).toFixed(1)} ${toY(opening.end.y).toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${toX(opening.start.x).toFixed(1)} ${(toY(opening.start.y) - radius).toFixed(1)}" stroke="#94a3b8"/>`);
    } else if (opening.side === 'w') {
      parts.push(`<path d="M ${toX(opening.end.x).toFixed(1)} ${toY(opening.end.y).toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${(toX(opening.start.x) + radius).toFixed(1)} ${toY(opening.start.y).toFixed(1)}" stroke="#94a3b8"/>`);
    } else {
      parts.push(`<path d="M ${toX(opening.start.x).toFixed(1)} ${toY(opening.start.y).toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${(toX(opening.end.x) - radius).toFixed(1)} ${toY(opening.end.y).toFixed(1)}" stroke="#94a3b8"/>`);
    }
  });
  parts.push('</g>');

  parts.push('<g data-layer="A-FURN" fill="#e2e8f0" stroke="#475569" stroke-width="1.5">');
  sheet.fixtures.forEach((fixture) => {
    const x = toX(fixture.center.x) - (fixture.width * PX_PER_METER) / 2;
    const y = toY(fixture.center.y) - (fixture.depth * PX_PER_METER) / 2;
    parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(fixture.width * PX_PER_METER).toFixed(1)}" height="${(fixture.depth * PX_PER_METER).toFixed(1)}" rx="3"/>`);
  });
  parts.push('</g>');

  parts.push('<g data-layer="A-DIMS" stroke="#94a3b8" stroke-width="1.5" fill="#475569">');
  sheet.dimensions.forEach((dimension) => {
    parts.push(`<line x1="${toX(dimension.start.x).toFixed(1)}" y1="${toY(dimension.start.y).toFixed(1)}" x2="${toX(dimension.end.x).toFixed(1)}" y2="${toY(dimension.end.y).toFixed(1)}"/>`);
    const textX = (toX(dimension.start.x) + toX(dimension.end.x)) / 2;
    const textY = (toY(dimension.start.y) + toY(dimension.end.y)) / 2 - 6;
    parts.push(`<text x="${textX.toFixed(1)}" y="${textY.toFixed(1)}" font-size="11" text-anchor="middle">${escapeHtml(dimension.text)}</text>`);
  });
  parts.push('</g>');

  parts.push('<g data-layer="A-TEXT" fill="#0f172a">');
  sheet.rooms.forEach((room) => {
    const centerX = toX(room.center.x);
    const centerY = toY(room.center.y);
    parts.push(`<text x="${centerX.toFixed(1)}" y="${(centerY - 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700">${escapeHtml(room.name)}</text>`);
    parts.push(`<text x="${centerX.toFixed(1)}" y="${(centerY + 12).toFixed(1)}" text-anchor="middle" font-size="11" fill="#475569">${escapeHtml(`${room.area.toFixed(1)} m² · ${room.bounds.width.toFixed(1)}×${room.bounds.height.toFixed(1)} m`)}</text>`);
  });
  parts.push('</g>');

  const legendX = width - LEGEND_W + 12;
  parts.push(`<g data-layer="A-LEGEND"><line x1="${width - LEGEND_W}" y1="${HEADER_H}" x2="${width - LEGEND_W}" y2="${height - 20}" stroke="#e2e8f0" stroke-width="1"/>`);
  parts.push(`<text x="${legendX}" y="${HEADER_H + 22}" font-size="13" font-weight="700" fill="#0f172a">Servicios por zona</text>`);
  let legendY = HEADER_H + 44;
  sheet.legend.forEach((item) => {
    parts.push(`<text x="${legendX}" y="${legendY}" font-size="12" font-weight="600" fill="#134e4a">${escapeHtml(item.title)} · ${escapeHtml(item.subtitle)}</text>`);
    legendY += 15;
    item.lines.slice(0, 3).forEach((line) => {
      parts.push(`<text x="${legendX}" y="${legendY}" font-size="10.5" fill="#64748b">${escapeHtml(line)}</text>`);
      legendY += 13;
    });
    legendY += 8;
  });
  parts.push('</g>');

  parts.push('</svg>');
  return { svg: parts.join(''), width, height };
}

function selectSheet(model, options) {
  if (!model?.sheets?.length) return null;
  if (typeof options.level === 'number') return model.sheets.find((sheet) => sheet.level === options.level) || model.sheets[0];
  if (options.sheetId) return model.sheets.find((sheet) => sheet.id === options.sheetId) || model.sheets[0];
  return model.sheets[0];
}

function uniqueSegments(walls) {
  const seen = new Set();
  return walls.filter((wall) => {
    const key = segmentKey(wall.start, wall.end);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueOpenings(openings) {
  const seen = new Set();
  return openings.filter((opening) => {
    const key = `${segmentKey(opening.start, opening.end)}:${opening.kind}:${opening.role}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function subtractOpeningSegments(wall, openings) {
  const relevant = openings.filter((opening) => isOpeningOnWall(wall, opening));
  if (!relevant.length) return [wall];

  if (wall.start.x === wall.end.x) {
    const x = wall.start.x;
    const points = [
      wall.start.y,
      ...relevant.flatMap((opening) => [opening.start.y, opening.end.y]),
      wall.end.y,
    ].sort((a, b) => a - b);
    const segments = [];
    for (let i = 0; i < points.length - 1; i += 2) {
      const start = points[i];
      const end = points[i + 1];
      if (end - start > 0.01) {
        segments.push({ start: { x, y: start }, end: { x, y: end } });
      }
    }
    return segments;
  }

  const y = wall.start.y;
  const points = [
    wall.start.x,
    ...relevant.flatMap((opening) => [opening.start.x, opening.end.x]),
    wall.end.x,
  ].sort((a, b) => a - b);
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 2) {
    const start = points[i];
    const end = points[i + 1];
    if (end - start > 0.01) {
      segments.push({ start: { x: start, y }, end: { x: end, y } });
    }
  }
  return segments;
}

function isOpeningOnWall(wall, opening) {
  return (
    Math.abs(wall.start.x - wall.end.x) < 1e-6
      ? Math.abs(opening.start.x - wall.start.x) < 1e-6 && Math.abs(opening.end.x - wall.end.x) < 1e-6
      : Math.abs(opening.start.y - wall.start.y) < 1e-6 && Math.abs(opening.end.y - wall.end.y) < 1e-6
  );
}

function segmentKey(start, end) {
  const a = `${start.x.toFixed(4)},${start.y.toFixed(4)}`;
  const b = `${end.x.toFixed(4)},${end.y.toFixed(4)}`;
  return [a, b].sort().join('|');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}
