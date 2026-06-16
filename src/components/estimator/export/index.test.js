import { describe, expect, test } from 'vitest';

import { buildPlanModel, exportPlanDxf, renderPlanSvg } from './index.js';
import {
  DRAFT_STORAGE_KEY,
  loadEstimatorDraft,
  saveEstimatorDraft,
  serializeEstimatorDraft,
} from './draftState.js';

function makeRoom(id, type, patch = {}) {
  return {
    id,
    type,
    level: 0,
    width: 4,
    length: 3,
    height: 2.6,
    reform: 'integral',
    finish: 'medio',
    paint: '#f1f5f9',
    led: '#fff7cc',
    openKitchen: false,
    openings: {},
    furniture: [],
    services: {
      carpinteria: { on: true, puertas: true, ventanas: true },
      mobiliario: { on: true, amueblar: true },
      revestimientos: { on: true, pintura: true },
      electricidad: { on: true, led: true },
    },
    ...patch,
  };
}

function makeStorage() {
  const state = new Map();
  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
    removeItem(key) {
      state.delete(key);
    },
  };
}

describe('PlanModel export layer', () => {
  test('separates sheets by floor and labels them consistently', () => {
    const rooms = [
      makeRoom(1, 'salon', { width: 5, length: 4, level: 0 }),
      makeRoom(2, 'cocina', { width: 3, length: 3, level: 0 }),
      makeRoom(3, 'dormitorio', { width: 4, length: 3.5, level: 1 }),
    ];

    const model = buildPlanModel(rooms, { vivienda: 'duplex', extras: {}, notas: '' });

    expect(model.sheets).toHaveLength(2);
    expect(model.sheets.map((sheet) => sheet.level)).toEqual([0, 1]);
    expect(model.sheets.map((sheet) => sheet.name)).toEqual(['Planta baja', 'Planta 1']);
    expect(model.meta.totalM2).toBeCloseTo(43, 3);
  });

  test('keeps shared openings aligned across adjacent rooms', () => {
    const rooms = [
      makeRoom(1, 'salon', { width: 4, length: 4, cx: -2, cz: 0 }),
      makeRoom(2, 'cocina', { width: 4, length: 4, cx: 2, cz: 0 }),
    ];

    const model = buildPlanModel(rooms, { vivienda: 'piso', extras: {}, notas: '' });
    const openings = model.sheets[0].openings;
    const eastDoor = openings.find((opening) => opening.roomId === 1 && opening.side === 'e');
    const westDoor = openings.find((opening) => opening.roomId === 2 && opening.side === 'w');

    expect(eastDoor).toBeTruthy();
    expect(westDoor).toBeTruthy();
    expect(eastDoor.center.x).toBeCloseTo(westDoor.center.x, 6);
    expect(eastDoor.center.y).toBeCloseTo(westDoor.center.y, 6);
    expect(eastDoor.width).toBeCloseTo(westDoor.width, 6);
  });

  test('generates room labels, dimensions, filtered fixtures and structured svg layers', () => {
    const rooms = [
      makeRoom(1, 'dormitorio', {
        width: 5,
        length: 3.5,
        furniture: [
          { id: 'f1', key: 'wardrobe', px: 1.1, pz: 1.2, rot: 0 },
          { id: 'f2', key: 'chair', px: 0, pz: 0, rot: 0 },
          { id: 'f3', key: 'plant', px: -1.2, pz: 1.1, rot: 0 },
        ],
      }),
    ];

    const model = buildPlanModel(rooms, { vivienda: 'piso', extras: {}, notas: '' });
    const sheet = model.sheets[0];
    const fixtureKeys = sheet.fixtures.map((fixture) => fixture.key);
    const { svg } = renderPlanSvg(model);

    expect(sheet.rooms[0].label).toContain('Dormitorio');
    expect(sheet.dimensions.some((dimension) => dimension.text === '5.0 m')).toBe(true);
    expect(sheet.dimensions.some((dimension) => dimension.text === '3.5 m')).toBe(true);
    expect(fixtureKeys).toContain('wardrobe');
    expect(fixtureKeys).not.toContain('chair');
    expect(fixtureKeys).not.toContain('plant');
    expect(svg).toContain('data-layer="A-WALL"');
    expect(svg).toContain('data-layer="A-DIMS"');
    expect(svg).toContain('Planta baja');
  });

  test('reports invalid overlapping rooms and produces layered dxf output', () => {
    const validRooms = [
      makeRoom(1, 'salon', { width: 4, length: 4, cx: -2, cz: 0 }),
      makeRoom(2, 'cocina', { width: 4, length: 4, cx: 2, cz: 0 }),
    ];
    const invalidRooms = [
      makeRoom(1, 'salon', { width: 4, length: 4, cx: 0, cz: 0 }),
      makeRoom(2, 'cocina', { width: 4, length: 4, cx: 0.5, cz: 0.5 }),
    ];

    const validModel = buildPlanModel(validRooms, { vivienda: 'piso', extras: {}, notas: '' });
    const invalidModel = buildPlanModel(invalidRooms, { vivienda: 'piso', extras: {}, notas: '' });
    const dxf = exportPlanDxf(validModel);

    expect(validModel.validations.filter((issue) => issue.severity === 'error')).toHaveLength(0);
    expect(invalidModel.validations.some((issue) => issue.code === 'ROOM_OVERLAP')).toBe(true);
    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('A-WALL');
    expect(dxf).toContain('A-OPEN');
    expect(dxf).toContain('A-DIMS');
    expect(dxf).toContain('A-TEXT');
    expect(dxf).toContain('A-FURN');
    expect(dxf).toContain('A-LEVEL');
  });

  test('serializes and restores estimator drafts from storage', () => {
    const draft = {
      setup: { vivienda: 'piso', m2: 80, notas: 'Conservar carpinteria', extras: { domotica: true } },
      rooms: [makeRoom(1, 'salon')],
      selectedId: 1,
      activeLevel: 0,
      view: 'plan',
    };
    const storage = makeStorage();
    const serialized = serializeEstimatorDraft(draft);

    expect(serialized).toContain('"version":1');

    saveEstimatorDraft(draft, storage);
    const restored = loadEstimatorDraft(storage);

    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBe(serialized);
    expect(restored.setup.notas).toBe('Conservar carpinteria');
    expect(restored.rooms).toHaveLength(1);
    expect(restored.view).toBe('plan');
  });
});
