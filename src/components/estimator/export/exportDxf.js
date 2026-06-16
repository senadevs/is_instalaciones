const DXF_GAP = 6;

export function exportPlanDxf(model) {
  const parts = [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1009',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'ENDSEC',
    '0', 'SECTION',
    '2', 'ENTITIES',
  ];

  let offsetX = 0;

  model.sheets.forEach((sheet) => {
    const localWalls = uniqueSegments(sheet.walls);
    const localOpenings = uniqueOpenings(sheet.openings);
    const shifted = (point) => ({ x: point.x + offsetX, y: -point.y });

    parts.push(...textEntity(offsetX + sheet.bounds.minX, -(sheet.bounds.minY - 1.2), sheet.name, 'A-LEVEL', 0.24));

    localWalls.forEach((wall) => {
      subtractOpeningSegments(wall, localOpenings).forEach((segment) => {
        parts.push(...lineEntity(shifted(segment.start), shifted(segment.end), 'A-WALL'));
      });
    });

    localOpenings.forEach((opening) => {
      parts.push(...lineEntity(shifted(opening.start), shifted(opening.end), 'A-OPEN'));
    });

    sheet.dimensions.forEach((dimension) => {
      parts.push(...lineEntity(shifted(dimension.start), shifted(dimension.end), 'A-DIMS'));
      const textPoint = midpoint(shifted(dimension.start), shifted(dimension.end));
      parts.push(...textEntity(textPoint.x, textPoint.y + 0.14, dimension.text, 'A-DIMS', 0.16));
    });

    sheet.rooms.forEach((room) => {
      parts.push(...textEntity(offsetX + room.center.x, -room.center.y, room.name, 'A-TEXT', 0.2, 'CENTER'));
    });

    sheet.fixtures.forEach((fixture) => {
      const minX = fixture.center.x - fixture.width / 2 + offsetX;
      const maxX = fixture.center.x + fixture.width / 2 + offsetX;
      const minY = -(fixture.center.y + fixture.depth / 2);
      const maxY = -(fixture.center.y - fixture.depth / 2);
      const box = [
        [{ x: minX, y: minY }, { x: maxX, y: minY }],
        [{ x: maxX, y: minY }, { x: maxX, y: maxY }],
        [{ x: maxX, y: maxY }, { x: minX, y: maxY }],
        [{ x: minX, y: maxY }, { x: minX, y: minY }],
      ];
      box.forEach(([start, end]) => parts.push(...lineEntity(start, end, 'A-FURN')));
    });

    offsetX += sheet.bounds.width + DXF_GAP;
  });

  parts.push('0', 'ENDSEC', '0', 'EOF');
  return `${parts.join('\n')}\n`;
}

function lineEntity(start, end, layer) {
  return [
    '0', 'LINE',
    '8', layer,
    '10', start.x.toFixed(4),
    '20', start.y.toFixed(4),
    '30', '0.0',
    '11', end.x.toFixed(4),
    '21', end.y.toFixed(4),
    '31', '0.0',
  ];
}

function textEntity(x, y, text, layer, height, align = 'LEFT') {
  const base = [
    '0', 'TEXT',
    '8', layer,
    '10', x.toFixed(4),
    '20', y.toFixed(4),
    '30', '0.0',
    '40', height.toFixed(4),
    '1', text,
  ];

  if (align === 'CENTER') {
    base.push('72', '1', '11', x.toFixed(4), '21', y.toFixed(4), '31', '0.0');
  }

  return base;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
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

  if (Math.abs(wall.start.x - wall.end.x) < 1e-6) {
    const x = wall.start.x;
    const points = [wall.start.y, ...relevant.flatMap((opening) => [opening.start.y, opening.end.y]), wall.end.y].sort((a, b) => a - b);
    const segments = [];
    for (let i = 0; i < points.length - 1; i += 2) {
      if (points[i + 1] - points[i] > 0.01) {
        segments.push({ start: { x, y: points[i] }, end: { x, y: points[i + 1] } });
      }
    }
    return segments;
  }

  const y = wall.start.y;
  const points = [wall.start.x, ...relevant.flatMap((opening) => [opening.start.x, opening.end.x]), wall.end.x].sort((a, b) => a - b);
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 2) {
    if (points[i + 1] - points[i] > 0.01) {
      segments.push({ start: { x: points[i], y }, end: { x: points[i + 1], y } });
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
