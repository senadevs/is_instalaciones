import { useState } from 'react';
import Panel from './Panel.jsx';
import Scene3D from './Scene3D.jsx';
import PlanEditor from './PlanEditor.jsx';
import { Icon } from './ui.jsx';
import {
  ROOM_TYPES, VIVIENDAS, FINISHES, REFORMS,
  SERVICES, DEFAULT_SERVICES, EXTRAS, autoFurnish,
  FURNITURE_BY_KEY, FURNITURE_CATALOG, catsFor,
} from './catalog.js';
import { scaleRoomsToArea, findFreeSpot } from './geometry.js';
import { downloadPlanPNG } from './plan2d.js';

let uid = 1;
let fuid = 1;

function buildServices(type) {
  const active = DEFAULT_SERVICES[type] || DEFAULT_SERVICES.default;
  const out = {};
  for (const [k, svc] of Object.entries(SERVICES)) {
    const on = active.includes(k);
    const o = { on };
    svc.opts.forEach((op) => { o[op.key] = on && !!op.default; });
    out[k] = o;
  }
  return out;
}

function newRoom(type) {
  const d = ROOM_TYPES[type].def;
  return {
    id: uid++, type, width: d[0], length: d[1], height: 2.6,
    reform: 'integral', finish: 'medio', paint: '#f1f5f9', led: '#fff7cc',
    openKitchen: false, openings: {}, furniture: [], services: buildServices(type),
  };
}

export default function Estimator() {
  const [setup, setSetup] = useState({ vivienda: 'piso', m2: 80, notas: '', extras: {} });
  const [rooms, setRooms] = useState([newRoom('salon'), newRoom('cocina'), newRoom('bano')]);
  const [selectedId, setSelectedId] = useState(null);
  const [interior, setInterior] = useState(null);
  const [addType, setAddType] = useState('dormitorio');
  const [view, setView] = useState('3d');
  const [insideItem, setInsideItem] = useState('');

  const totalM2 = rooms.reduce((s, r) => s + r.width * r.length, 0);
  const totalSize = Math.max(9, Math.sqrt(totalM2) * 2.6);
  const interiorRoom = rooms.find((r) => r.id === interior);
  const insideItems = interiorRoom ? FURNITURE_CATALOG.filter((f) => catsFor(interiorRoom.type).includes(f.cat)) : [];

  const addRoom = (type = addType) => { const r = newRoom(type); setRooms((rs) => [...rs, r]); setSelectedId(r.id); };
  const scaleArea = () => setRooms((rs) => scaleRoomsToArea(rs, Number(setup.m2)));
  const removeRoom = (id) => { setRooms((rs) => rs.filter((r) => r.id !== id)); if (selectedId === id) setSelectedId(null); if (interior === id) setInterior(null); };
  const updateRoom = (id, patch) => setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const toggleService = (id, svc) => setRooms((rs) => rs.map((r) => {
    if (r.id !== id) return r;
    const cur = r.services[svc] || { on: false };
    const turningOn = !cur.on;
    const next = { ...cur, on: turningOn };
    if (turningOn) SERVICES[svc].opts.forEach((o) => { if (o.default) next[o.key] = true; });
    return { ...r, services: { ...r.services, [svc]: next } };
  }));

  const toggleOpt = (id, svc, key) => setRooms((rs) => rs.map((r) => (
    r.id === id ? { ...r, services: { ...r.services, [svc]: { ...r.services[svc], on: true, [key]: !r.services[svc]?.[key] } } } : r
  )));

  const setOpening = (id, side, val) => setRooms((rs) => rs.map((r) => {
    if (r.id !== id) return r;
    const openings = { ...r.openings };
    if (val) openings[side] = val; else delete openings[side];
    return { ...r, openings };
  }));

  // ---- Posición de zonas (drag en planta) ----
  const bakeAll = (positions) => setRooms((rs) => rs.map((r) => (
    positions[r.id] ? { ...r, cx: positions[r.id].cx, cz: positions[r.id].cz } : r
  )));

  // ---- Mobiliario por zona ----
  const mapFurn = (roomId, fn) => setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, furniture: fn(r.furniture || [], r) } : r)));
  const addFurniture = (roomId, key, px, pz, rot = 0) => mapFurn(roomId, (f, r) => {
    // Si la zona estaba auto-amueblada (sin muebles manuales), sembramos el
    // auto-amueblado antes de añadir, para no perder la distribución base.
    const base = (f.length === 0 && r.services?.mobiliario?.on)
      ? autoFurnish(r.type, r.width, r.length).map((it) => ({ ...it, id: 'f' + (fuid++) }))
      : f;
    return [...base, { id: 'f' + (fuid++), key, px, pz, rot }];
  });
  const moveFurniture = (roomId, fId, px, pz) => mapFurn(roomId, (f) => f.map((it) => (it.id === fId ? { ...it, px, pz } : it)));
  const rotateFurniture = (roomId, fId) => mapFurn(roomId, (f) => f.map((it) => (it.id === fId ? { ...it, rot: ((it.rot || 0) + Math.PI / 2) % (Math.PI * 2) } : it)));
  const removeFurniture = (roomId, fId) => mapFurn(roomId, (f) => f.filter((it) => it.id !== fId));
  const autoFurnishRoom = (roomId) => mapFurn(roomId, (_f, r) => autoFurnish(r.type, r.width, r.length).map((it) => ({ ...it, id: 'f' + (fuid++) })));
  const clearFurniture = (roomId) => mapFurn(roomId, () => []);

  // Colocar un elemento en la zona actual mientras navegas (busca hueco libre).
  const addInside = (key) => mapFurn(interior, (f, r) => {
    const item = FURNITURE_BY_KEY[key];
    const base = (f.length === 0 && r.services?.mobiliario?.on)
      ? autoFurnish(r.type, r.width, r.length).map((it) => ({ ...it, id: 'f' + (fuid++) }))
      : f;
    const others = base.map((it) => { const c = FURNITURE_BY_KEY[it.key] || { w: 0.5, d: 0.5 }; return { ...it, w: c.w, d: c.d }; });
    const spot = findFreeSpot(r, item, others);
    if (!spot) return base;
    return [...base, { id: 'f' + (fuid++), key, px: spot.x, pz: spot.z, rot: 0 }];
  });

  const descargarPlano = () => downloadPlanPNG(rooms, setup);

  function solicitar() {
    let msg = `Hola, quiero presupuesto para reformar mi ${VIVIENDAS[setup.vivienda].label.toLowerCase()}`;
    if (setup.m2) msg += ` de unos ${setup.m2} m²`;
    msg += '. Configuración:\n\n';
    rooms.forEach((r, i) => {
      msg += `${i + 1}. ${ROOM_TYPES[r.type].label} — ${r.width}×${r.length} m (${(r.width * r.length).toFixed(1)} m²), ${REFORMS[r.reform].toLowerCase()}, acabado ${FINISHES[r.finish].toLowerCase()}.\n`;
      Object.entries(SERVICES).forEach(([k, svc]) => {
        const s = r.services?.[k];
        if (!s?.on) return;
        const chosen = svc.opts.filter((o) => s[o.key]).map((o) => o.label);
        msg += `   • ${svc.label}${chosen.length ? ': ' + chosen.join(', ') : ''}.\n`;
      });
      if (r.openKitchen) msg += '   • Cocina americana.\n';
    });
    const ex = EXTRAS.filter((e) => setup.extras?.[e.key]).map((e) => e.label);
    if (ex.length) msg += `\nExtras: ${ex.join(', ')}.`;
    if (setup.notas) msg += `\nNotas: ${setup.notas}`;
    msg += `\n\nTotal: ${rooms.length} estancias · ${totalM2.toFixed(1)} m². ¿Me dais presupuesto?`;
    msg += '\n\n📐 Adjunto el plano de la reforma (descargado en mi dispositivo).';
    // Descarga el plano para que el cliente lo adjunte al chat.
    try { descargarPlano(); } catch (e) { /* noop */ }
    window.open('https://wa.me/34637591736?text=' + encodeURIComponent(msg), '_blank');
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] lg:h-[calc(100vh-7rem)] min-h-[560px] bg-zinc-900">
      <Panel
        setup={setup} setSetup={setSetup} rooms={rooms} totalM2={totalM2}
        selectedId={selectedId} setSelectedId={setSelectedId}
        addType={addType} setAddType={setAddType}
        onAdd={addRoom} onRemove={removeRoom} onUpdate={updateRoom}
        onToggleService={toggleService} onToggleOpt={toggleOpt} onSetOpening={setOpening}
        interior={interior} onEnterInterior={setInterior} onSolicitar={solicitar}
        onScaleArea={scaleArea} onShowPlan={() => setView('plan')}
        onDownloadPlan={descargarPlano}
      />

      <div className="relative flex-1 min-h-[400px]">
        {view === '3d' ? (
          <>
            <Scene3D
              rooms={rooms} vivienda={setup.vivienda}
              selectedId={selectedId} onSelect={setSelectedId}
              interior={interior} onEnter={setInterior} totalSize={totalSize}
            />
            <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-zinc-300 shadow-sm pointer-events-none border border-zinc-800">
              {interior ? 'Clic para explorar · WASD moverte · ratón mirar · Shift correr · ESC suelta el ratón' : 'Arrastra para girar · doble clic en una zona para entrar'}
            </div>
            {interior && (
              <>
                <button onClick={() => setInterior(null)} className="absolute top-3 right-3 bg-white text-primary text-sm font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-gray-50">← Salir</button>
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1.5">
                  <Icon name="plus-circle" size={16} className="text-primary" />
                  <select value={insideItem} onChange={(e) => setInsideItem(e.target.value)} className="text-sm px-2 py-1 rounded-md border border-gray-200 bg-white text-slate-700 max-w-[160px] outline-none">
                    <option value="">Añadir a esta zona…</option>
                    {insideItems.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <button onClick={() => { if (insideItem) addInside(insideItem); }} disabled={!insideItem} className="bg-primary text-white rounded-md px-2 py-1 hover:bg-secondary transition-colors disabled:opacity-40"><Icon name="plus" size={15} /></button>
                </div>
              </>
            )}
          </>
        ) : (
          <PlanEditor
            rooms={rooms} selectedId={selectedId} onSelect={setSelectedId}
            onBakeAll={bakeAll} onAddFurniture={addFurniture} onMoveFurniture={moveFurniture}
            onRotateFurniture={rotateFurniture} onRemoveFurniture={removeFurniture}
            onAutoFurnish={autoFurnishRoom} onClearFurniture={clearFurniture}
          />
        )}

        {/* Conmutador de vista */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex bg-zinc-950/85 backdrop-blur rounded-lg p-0.5 border border-zinc-800 shadow-lg">
          {[['3d', 'cube', '3D'], ['plan', 'layout-grid', 'Planta']].map(([v, ic, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <Icon name={ic} size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
