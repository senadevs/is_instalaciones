import { describe, expect, test } from 'vitest';

import { getModelAnchorOffset, resolveFurnitureRenderPose } from './renderPlacement.js';

describe('Estimator 3D render placement', () => {
  test('normalizes offset pivots to a floor-centered anchor', () => {
    const anchor = getModelAnchorOffset({
      min: [0, 0, -0.25],
      max: [0.8, 0.31, 0],
    });

    expect(anchor.x).toBeCloseTo(-0.4, 6);
    expect(anchor.y).toBeCloseTo(0, 6);
    expect(anchor.z).toBeCloseTo(0.125, 6);
  });

  test('stacks a tv over its cabinet when both are colocated', () => {
    const furniture = [
      { id: 'cabinet-1', key: 'tvCabinet', px: 0, pz: 1.45, rot: Math.PI },
      { id: 'tv-1', key: 'tv', px: 0, pz: 1.4, rot: Math.PI },
    ];

    const pose = resolveFurnitureRenderPose(furniture[1], furniture);

    expect(pose.x).toBeCloseTo(0, 6);
    expect(pose.z).toBeCloseTo(1.45, 6);
    expect(pose.y).toBeGreaterThan(0.3);
  });
});
