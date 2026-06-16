import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Panel from './Panel.jsx';
import PlanEditor from './PlanEditor.jsx';
import { Icon } from './ui.jsx';
import {
  EXTRAS,
  FINISHES,
  FURNITURE_BY_KEY,
  FURNITURE_CATALOG,
  REFORMS,
  ROOM_TYPES,
  SERVICES,
  VIVIENDAS,
  catsFor,
  plantasFor,
} from './catalog.js';
import { clearDoorway, clearDoorways, computeWalls, findFreeSpot, fittedAuto, getOpening, placeRooms, scaleRoomsToArea } from './geometry.js';
import {
  buildPlanModel,
  downloadPlanDxf,
  downloadPlanPng,
  downloadPlanSvg,
  downloadProjectJson,
  exportPlanPdf,
  getPlanErrors,
  hasPlanErrors,
} from './export/index.js';
import {
  clearEstimatorDraft,
  loadEstimatorDraft,
  saveEstimatorDraft,
} from './export/draftState.js';
import {
  createDefaultEstimatorState,
  makeRooms,
  newRoom,
  normalizeEstimatorDraft,
  syncRoomIdSeed,
} from './state.js';

const Scene3D = lazy(() => import('./Scene3D.jsx'));

let fuid = 1;

export default function Estimator() {
  const initialRef = useRef(null);
  if (!initialRef.current) {
    initialRef.current = createDefaultEstimatorState();
  }
  const [setup, setSetup] = useState(() => initialRef.current.setup);
  const [rooms, setRooms] = useState(() => initialRef.current.rooms);
  const [selectedId, setSelectedId] = useState(() => initialRef.current.selectedId);
  const [interior, setInterior] = useState(() => initialRef.current.interior);
  const [addType, setAddType] = useState(() => initialRef.current.addType);
  const [view, setView] = useState(() => initialRef.current.view);
  const [insideItem, setInsideItem] = useState(() => initialRef.current.insideItem);
  const [activeLevel, setActiveLevel] = useState(() => initialRef.current.activeLevel);
  const [exportState, setExportState] = useState({ status: 'idle', kind: '', error: '' });
  const [draftOffer, setDraftOffer] = useState(null);
  const [draftResolved, setDraftResolved] = useState(false);

  const plantasMax = plantasFor(setup.vivienda);
  const niveles = Math.max(0, ...rooms.map((room) => room.level || 0)) + 1;
  const totalM2 = rooms.reduce((sum, room) => sum + room.width * room.length, 0);
  const totalSize = Math.max(9, Math.sqrt(totalM2) * 2.6);
  const interiorRoom = rooms.find((room) => room.id === interior);
  const insideItems = interiorRoom ? FURNITURE_CATALOG.filter((item) => catsFor(interiorRoom.type).includes(item.cat)) : [];
  const planModel = useMemo(() => buildPlanModel(rooms, setup), [rooms, setup]);
  const planErrors = useMemo(() => getPlanErrors(planModel), [planModel]);
  const exportBlocked = hasPlanErrors(planModel);

  const currentState = useMemo(() => ({
    setup,
    rooms,
    selectedId,
    interior,
    addType,
    view,
    insideItem,
    activeLevel,
  }), [setup, rooms, selectedId, interior, addType, view, insideItem, activeLevel]);

  useEffect(() => {
    trackEstimatorEvent('view_estimator', { route: '/estimador' });
    const storedDraft = loadEstimatorDraft();
    if (storedDraft) {
      setDraftOffer(storedDraft);
      setDraftResolved(false);
      return;
    }
    setDraftResolved(true);
  }, []);

  useEffect(() => {
    if (!draftResolved) return;
    saveEstimatorDraft(currentState);
  }, [currentState, draftResolved]);

  const applyEstimatorState = (snapshot) => {
    const normalized = normalizeEstimatorDraft(snapshot);
    syncRoomIdSeed(normalized.rooms);
    setSetup(normalized.setup);
    setRooms(normalized.rooms);
    setSelectedId(normalized.selectedId);
    setInterior(normalized.interior);
    setAddType(normalized.addType);
    setView(normalized.view);
    setInsideItem(normalized.insideItem);
    setActiveLevel(normalized.activeLevel);
  };

  const recoverDraft = () => {
    if (!draftOffer) return;
    applyEstimatorState(draftOffer);
    setDraftOffer(null);
    setDraftResolved(true);
    trackEstimatorEvent('recover_estimator_draft');
  };

  const dismissDraft = () => {
    clearEstimatorDraft();
    setDraftOffer(null);
    setDraftResolved(true);
    trackEstimatorEvent('dismiss_estimator_draft');
  };

  const resetDraft = () => {
    clearEstimatorDraft();
    const clean = createDefaultEstimatorState();
    applyEstimatorState(clean);
    setDraftOffer(null);
    setDraftResolved(true);
    setExportState({ status: 'idle', kind: '', error: '' });
    trackEstimatorEvent('reset_estimator_draft');
  };

  const changeVivienda = (vivienda) => {
    setSetup((current) => ({ ...current, vivienda }));
    setRooms(makeRooms(vivienda));
    setActiveLevel(0);
    setSelectedId(null);
    setInterior(null);
    setView('plan');
  };

  const addPlanta = () => {
    if (niveles >= plantasMax) return;
    setRooms((currentRooms) => {
      let work = currentRooms;
      const maxLevel = Math.max(0, ...work.map((room) => room.level || 0));
      if (!work.some((room) => ['escalera', 'ascensor', 'rampa'].includes(room.type))) {
        work = [...work, newRoom('escalera', 0)];
      }
      const placed = placeRooms(work);
      const baked = work.map((room) => {
        const match = placed.find((candidate) => candidate.id === room.id);
        return match ? { ...room, cx: match.cx, cz: match.cz } : room;
      });
      const newLevel = maxLevel + 1;
      const clones = baked
        .filter((room) => (room.level || 0) === maxLevel)
        .map((room) => ({
          ...room,
          id: newRoom(room.type, newLevel).id,
          level: newLevel,
          openings: { ...room.openings },
          services: JSON.parse(JSON.stringify(room.services)),
          furniture: [],
        }));
      return [...baked, ...clones];
    });
    setActiveLevel(niveles);
  };

  const removePlanta = (level) => {
    if (level === 0) return;
    setRooms((currentRooms) => currentRooms.filter((room) => (room.level || 0) !== level));
    setActiveLevel((current) => (current >= level ? level - 1 : current));
  };

  const addRoom = (type = addType) => {
    const room = newRoom(type, activeLevel);
    setRooms((currentRooms) => scaleRoomsToArea([...currentRooms, room], Number(setup.m2)));
    setSelectedId(room.id);
  };

  const scaleArea = () => setRooms((currentRooms) => scaleRoomsToArea(currentRooms, Number(setup.m2)));

  const removeRoom = (id) => {
    setRooms((currentRooms) => currentRooms.filter((room) => room.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (interior === id) setInterior(null);
  };

  const updateRoom = (id, patch) => setRooms((currentRooms) => currentRooms.map((room) => (room.id === id ? { ...room, ...patch } : room)));
  const rotateRoom = (id) => setRooms((currentRooms) => currentRooms.map((room) => (room.id === id ? { ...room, width: room.length, length: room.width } : room)));

  const toggleService = (id, serviceKey) => setRooms((currentRooms) => currentRooms.map((room) => {
    if (room.id !== id) return room;
    const current = room.services[serviceKey] || { on: false };
    const turningOn = !current.on;
    const next = { ...current, on: turningOn };
    if (turningOn) SERVICES[serviceKey].opts.forEach((option) => { if (option.default) next[option.key] = true; });
    return { ...room, services: { ...room.services, [serviceKey]: next } };
  }));

  const toggleOpt = (id, serviceKey, optionKey) => setRooms((currentRooms) => currentRooms.map((room) => (
    room.id === id
      ? { ...room, services: { ...room.services, [serviceKey]: { ...room.services[serviceKey], on: true, [optionKey]: !room.services[serviceKey]?.[optionKey] } } }
      : room
  )));

  const setOpening = (id, side, value) => setRooms((currentRooms) => {
    const next = currentRooms.map((room) => {
      if (room.id !== id) return room;
      const openings = { ...room.openings };
      if (value) openings[side] = value; else delete openings[side];
      return { ...room, openings };
    });
    if (!value) return next;
    const placed = placeRooms(next);
    const walls = computeWalls(placed);
    const index = placed.findIndex((candidate) => candidate.id === id);
    if (index < 0) return next;
    const opening = getOpening(placed[index], side, walls[index][side], {});
    if (!opening || opening.role === 'window') return next;
    const cleaned = clearDoorway(placed[index], side, opening);
    return next.map((room) => (room.id === id ? { ...room, furniture: cleaned } : room));
  });

  const bakeAll = (positions) => setRooms((currentRooms) => currentRooms.map((room) => (
    positions[room.id] ? { ...room, cx: positions[room.id].cx, cz: positions[room.id].cz } : room
  )));

  const mapFurniture = (roomId, updater) => setRooms((currentRooms) => {
    const placed = placeRooms(currentRooms);
    const walls = computeWalls(placed);
    return currentRooms.map((room) => {
      if (room.id !== roomId) return room;
      const index = placed.findIndex((candidate) => candidate.id === roomId);
      const roomContext = index >= 0
        ? { ...placed[index], ...room, furniture: room.furniture || [], _walls: walls[index] }
        : { ...room, furniture: room.furniture || [] };
      const nextFurniture = updater(room.furniture || [], roomContext);
      const cleaned = roomContext._walls
        ? clearDoorways({ ...roomContext, furniture: nextFurniture }, nextFurniture)
        : nextFurniture;
      return { ...room, furniture: cleaned };
    });
  });

  const addFurniture = (roomId, key, px, pz, rot = 0) => mapFurniture(roomId, (furniture, room) => {
    const base = (furniture.length === 0 && room.services?.mobiliario?.on)
      ? fittedAuto(room.type, room.width, room.length).map((item) => ({ ...item, id: `f${fuid += 1}` }))
      : furniture;
    return [...base, { id: `f${fuid += 1}`, key, px, pz, rot }];
  });
  const moveFurniture = (roomId, furnitureId, px, pz) => mapFurniture(roomId, (furniture) => furniture.map((item) => (item.id === furnitureId ? { ...item, px, pz } : item)));
  const rotateFurniture = (roomId, furnitureId) => mapFurniture(roomId, (furniture) => furniture.map((item) => (item.id === furnitureId ? { ...item, rot: ((item.rot || 0) + Math.PI / 2) % (Math.PI * 2) } : item)));
  const removeFurniture = (roomId, furnitureId) => mapFurniture(roomId, (furniture) => furniture.filter((item) => item.id !== furnitureId));
  const autoFurnishRoom = (roomId) => mapFurniture(roomId, (_furniture, room) => fittedAuto(room.type, room.width, room.length).map((item) => ({ ...item, id: `f${fuid += 1}` })));
  const clearFurniture = (roomId) => mapFurniture(roomId, () => []);

  const addInside = (key) => mapFurniture(interior, (furniture, room) => {
    const item = FURNITURE_BY_KEY[key];
    const base = (furniture.length === 0 && room.services?.mobiliario?.on)
      ? fittedAuto(room.type, room.width, room.length).map((candidate) => ({ ...candidate, id: `f${fuid += 1}` }))
      : furniture;
    const others = base.map((candidate) => {
      const config = FURNITURE_BY_KEY[candidate.key] || { w: 0.5, d: 0.5 };
      return { ...candidate, w: config.w, d: config.d };
    });
    const spot = findFreeSpot(room, item, others);
    if (!spot) return base;
    return [...base, { id: `f${fuid += 1}`, key, px: spot.x, pz: spot.z, rot: 0 }];
  });

  const goFloor = (delta) => {
    if (!interiorRoom) return;
    const target = (interiorRoom.level || 0) + delta;
    const candidates = rooms.filter((room) => (room.level || 0) === target);
    if (!candidates.length) return;
    const stair = candidates.find((room) => ['escalera', 'rampa', 'ascensor'].includes(room.type)) || candidates[0];
    setInterior(stair.id);
  };

  const handleExport = async (kind) => {
    if (['pdf', 'dxf', 'svg'].includes(kind) && exportBlocked) {
      setExportState({
        status: 'error',
        kind,
        error: 'Corrige los solapes o dimensiones inválidas antes de exportar PDF, DXF o SVG.',
      });
      return;
    }

    setExportState({ status: 'running', kind, error: '' });
    try {
      if (kind === 'pdf') await exportPlanPdf(planModel);
      else if (kind === 'dxf') downloadPlanDxf(planModel);
      else if (kind === 'svg') downloadPlanSvg(planModel);
      else if (kind === 'png') await downloadPlanPng(planModel);
      else if (kind === 'json') downloadProjectJson(currentState);
      setExportState({ status: 'success', kind, error: '' });
      trackEstimatorEvent('export_estimator_plan', { format: kind, level_count: planModel.sheets.length });
    } catch (error) {
      setExportState({
        status: 'error',
        kind,
        error: error instanceof Error ? error.message : 'No se pudo completar la exportación.',
      });
    }
  };

  function solicitar() {
    let message = `Hola, quiero presupuesto para reformar mi ${VIVIENDAS[setup.vivienda].label.toLowerCase()}`;
    if (setup.m2) message += ` de unos ${setup.m2} m²`;
    message += '. Configuración:\n\n';
    rooms.forEach((room, index) => {
      message += `${index + 1}. ${ROOM_TYPES[room.type].label} — ${room.width}×${room.length} m (${(room.width * room.length).toFixed(1)} m²), ${REFORMS[room.reform].toLowerCase()}, acabado ${FINISHES[room.finish].toLowerCase()}.\n`;
      Object.entries(SERVICES).forEach(([key, service]) => {
        const selection = room.services?.[key];
        if (!selection?.on) return;
        const chosen = service.opts.filter((option) => selection[option.key]).map((option) => option.label);
        message += `   • ${service.label}${chosen.length ? `: ${chosen.join(', ')}` : ''}.\n`;
      });
      if (room.openKitchen) message += '   • Cocina americana.\n';
    });
    const extras = EXTRAS.filter((extra) => setup.extras?.[extra.key]).map((extra) => extra.label);
    if (extras.length) message += `\nExtras: ${extras.join(', ')}.`;
    if (setup.notas) message += `\nNotas: ${setup.notas}`;
    message += `\n\nTotal: ${rooms.length} estancias · ${totalM2.toFixed(1)} m². ¿Me dais presupuesto?`;
    message += '\n\nHe preparado el plano desde vuestro configurador 3D.';
    trackEstimatorEvent('send_estimator_whatsapp', { room_count: rooms.length, total_m2: totalM2.toFixed(1) });
    window.open(`https://wa.me/34637591736?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="flex min-h-[560px] flex-col bg-zinc-900 md:flex-row md:h-[calc(100vh-5rem)] lg:h-[calc(100vh-7rem)]">
      <Panel
        setup={setup}
        setSetup={setSetup}
        onVivienda={changeVivienda}
        rooms={rooms}
        totalM2={totalM2}
        plantas={niveles}
        plantasMax={plantasMax}
        onAddPlanta={addPlanta}
        onRemovePlanta={removePlanta}
        activeLevel={activeLevel}
        setActiveLevel={setActiveLevel}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        addType={addType}
        setAddType={setAddType}
        onAdd={addRoom}
        onRemove={removeRoom}
        onUpdate={updateRoom}
        onRotateRoom={rotateRoom}
        onToggleService={toggleService}
        onToggleOpt={toggleOpt}
        onSetOpening={setOpening}
        interior={interior}
        onEnterInterior={setInterior}
        onSolicitar={solicitar}
        onScaleArea={scaleArea}
        onShowPlan={() => setView('plan')}
        onExport={handleExport}
        exportState={exportState}
        planModel={planModel}
        planErrors={planErrors}
        onRecoverDraft={draftOffer ? recoverDraft : null}
        onDismissDraft={draftOffer ? dismissDraft : null}
        onResetDraft={resetDraft}
      />

      <div className="relative min-h-[420px] flex-1 md:min-h-0 md:min-w-0">
        {draftOffer && (
          <div className="absolute top-3 left-3 right-3 z-20 rounded-xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Hay un borrador guardado del estimador.</p>
                <p className="text-xs text-slate-500">Puedes recuperarlo o descartarlo antes de seguir editando.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={recoverDraft} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Recuperar borrador</button>
                <button onClick={dismissDraft} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Descartar</button>
              </div>
            </div>
          </div>
        )}

        {planErrors.length > 0 && (
          <div className="absolute top-3 left-1/2 z-20 w-[min(720px,calc(100%-1.5rem))] -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-start gap-3">
              <Icon name="triangle-alert" size={16} className="mt-0.5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">El plano tiene incidencias que bloquean PDF, DXF y SVG.</p>
                <ul className="mt-1 space-y-1 text-xs text-amber-800">
                  {planErrors.slice(0, 3).map((issue, index) => <li key={`${issue.code}-${index}`}>• {issue.message}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {view === '3d' ? (
          <>
            <Suspense fallback={<SceneFallback />}>
              <Scene3D
                rooms={rooms}
                vivienda={setup.vivienda}
                selectedId={selectedId}
                onSelect={setSelectedId}
                interior={interior}
                onEnter={setInterior}
                totalSize={totalSize}
              />
            </Suspense>
            <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-zinc-300 shadow-sm pointer-events-none border border-zinc-800">
              {interior ? 'Clic para explorar · WASD moverte · ratón mirar · Shift correr · ESC suelta el ratón' : 'Arrastra para girar · doble clic en una zona para entrar'}
            </div>
            {interior && (
              <>
                <button onClick={() => setInterior(null)} className="absolute top-3 right-3 bg-white text-primary text-sm font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-gray-50">← Salir</button>
                {niveles > 1 && (
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {rooms.some((room) => (room.level || 0) === (interiorRoom?.level || 0) + 1) && (
                      <button onClick={() => goFloor(1)} className="flex items-center gap-1 bg-white text-primary text-xs font-semibold px-2.5 py-1.5 rounded-md shadow hover:bg-gray-50"><Icon name="chevron-up" size={14} /> Subir planta</button>
                    )}
                    {(interiorRoom?.level || 0) > 0 && (
                      <button onClick={() => goFloor(-1)} className="flex items-center gap-1 bg-white text-primary text-xs font-semibold px-2.5 py-1.5 rounded-md shadow hover:bg-gray-50"><Icon name="chevron-down" size={14} /> Bajar planta</button>
                    )}
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1.5">
                  <Icon name="plus-circle" size={16} className="text-primary" />
                  <select value={insideItem} onChange={(event) => setInsideItem(event.target.value)} className="text-sm px-2 py-1 rounded-md border border-gray-200 bg-white text-slate-700 max-w-[160px] outline-none">
                    <option value="">Añadir a esta zona…</option>
                    {insideItems.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                  <button onClick={() => { if (insideItem) addInside(insideItem); }} disabled={!insideItem} className="bg-primary text-white rounded-md px-2 py-1 hover:bg-secondary transition-colors disabled:opacity-40"><Icon name="plus" size={15} /></button>
                </div>
              </>
            )}
          </>
        ) : (
          <PlanEditor
            rooms={rooms}
            planModel={planModel}
            planErrors={planErrors}
            selectedId={selectedId}
            onSelect={setSelectedId}
            plantas={niveles}
            activeLevel={activeLevel}
            setActiveLevel={setActiveLevel}
            onRotateRoom={rotateRoom}
            onBakeAll={bakeAll}
            onAddFurniture={addFurniture}
            onMoveFurniture={moveFurniture}
            onRotateFurniture={rotateFurniture}
            onRemoveFurniture={removeFurniture}
            onAutoFurnish={autoFurnishRoom}
            onClearFurniture={clearFurniture}
          />
        )}

        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex bg-zinc-950/85 backdrop-blur rounded-lg p-0.5 border border-zinc-800 shadow-lg">
          {[['plan', 'layout-grid', 'Planta'], ['3d', 'cube', '3D']].map(([targetView, icon, label]) => (
            <button
              key={targetView}
              onClick={() => setView(targetView)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${view === targetView ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Icon name={icon} size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-zinc-950 text-zinc-300">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm shadow-lg">
        Cargando visor 3D…
      </div>
    </div>
  );
}

function trackEstimatorEvent(name, extra = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...extra });
  } catch (_error) {
    // noop
  }
}
