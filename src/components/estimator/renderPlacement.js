const STACK_SUPPORTS = {
  tvCabinet: { topY: 0.31 },
  tvCabinetDoors: { topY: 0.31 },
};

const STACK_RULES = {
  tv: {
    supportKeys: new Set(['tvCabinet', 'tvCabinetDoors']),
    maxDistance: 0.45,
    liftY: 0.02,
  },
};

export function getModelAnchorOffset(bounds) {
  const min = Array.isArray(bounds?.min) ? bounds.min : [0, 0, 0];
  const max = Array.isArray(bounds?.max) ? bounds.max : [0, 0, 0];
  return {
    x: -((min[0] + max[0]) / 2),
    y: -(min[1] || 0),
    z: -((min[2] + max[2]) / 2),
  };
}

function findNearestSupport(item, furniture, rule) {
  let best = null;
  for (const candidate of furniture || []) {
    if (!candidate || candidate.id === item.id) continue;
    if (!rule.supportKeys.has(candidate.key)) continue;
    const dx = (candidate.px || 0) - (item.px || 0);
    const dz = (candidate.pz || 0) - (item.pz || 0);
    const distance = Math.hypot(dx, dz);
    if (distance > rule.maxDistance) continue;
    if (!best || distance < best.distance) best = { candidate, distance };
  }
  return best?.candidate || null;
}

export function resolveFurnitureRenderPose(item, furniture = []) {
  const base = { x: item?.px || 0, y: 0, z: item?.pz || 0 };
  if (!item?.key) return base;

  const rule = STACK_RULES[item.key];
  if (!rule) return base;

  const support = findNearestSupport(item, furniture, rule);
  if (!support) return base;

  const surface = STACK_SUPPORTS[support.key];
  if (!surface) return base;

  return {
    x: support.px || 0,
    y: surface.topY + rule.liftY,
    z: support.pz || 0,
  };
}
