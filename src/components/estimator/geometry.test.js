import { describe, expect, test } from 'vitest';

import { FURNITURE_BY_KEY } from './catalog.js';
import { clearances, findFreeSpot, furnitureFits, resolveFurniturePlacement } from './geometry.js';

describe('Estimator furniture placement', () => {
  test('keeps a sofa valid when snapping it flush to a wall', () => {
    const room = { width: 4.8, length: 4.2 };
    const item = FURNITURE_BY_KEY.sofa;
    const placement = resolveFurniturePlacement(room, item, 0, 99, 0);
    const gaps = clearances(room, item, placement.x, placement.z, 0);

    expect(furnitureFits(room, item, placement.x, placement.z, 0, [])).toBe(true);
    expect(gaps.frente).toBeLessThanOrEqual(0.06);
  });

  test('reduces the artificial gap for wall furniture like the TV cabinet', () => {
    const room = { width: 4.8, length: 4.2 };
    const item = FURNITURE_BY_KEY.tvCabinet;
    const placement = resolveFurniturePlacement(room, item, 0, 99, 0);
    const gaps = clearances(room, item, placement.x, placement.z, 0);

    expect(furnitureFits(room, item, placement.x, placement.z, 0, [])).toBe(true);
    expect(gaps.frente).toBeLessThanOrEqual(0.06);
  });

  test('rejects furniture that blocks a centered door opening', () => {
    const room = {
      type: 'salon',
      width: 4,
      length: 4,
      openKitchen: false,
      openings: {},
      _walls: {
        n: { type: 'ext' },
        s: { type: 'int', neighborId: 2, neighborType: 'pasillo', mid: 0 },
        e: { type: 'ext' },
        w: { type: 'ext' },
      },
    };
    const item = FURNITURE_BY_KEY.tvCabinet;

    expect(furnitureFits(room, item, 0, 1.75, 0, [])).toBe(false);
    expect(furnitureFits(room, item, 1.25, 1.75, 0, [])).toBe(true);
  });

  test('finds free spots away from door swing zones', () => {
    const room = {
      type: 'salon',
      width: 4,
      length: 4,
      openKitchen: false,
      openings: {},
      _walls: {
        n: { type: 'ext' },
        s: { type: 'int', neighborId: 2, neighborType: 'pasillo', mid: 0 },
        e: { type: 'ext' },
        w: { type: 'ext' },
      },
    };
    const item = FURNITURE_BY_KEY.tvCabinet;
    const spot = findFreeSpot(room, item, []);

    expect(spot).toBeTruthy();
    expect(furnitureFits(room, item, spot.x, spot.z, 0, [])).toBe(true);
    expect(Math.abs(spot.x) < 0.2 && spot.z > 1.2).toBe(false);
  });
});
