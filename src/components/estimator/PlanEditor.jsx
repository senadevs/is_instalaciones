import { useMemo, useRef, useState, useEffect } from 'react';
import {
  ROOM_TYPES, FURNITURE_CATALOG, FURNITURE_CATS, FURNITURE_BY_KEY,
  catsFor, furnitureAllowed, showsInPlan,
} from './catalog.js';
import { placeRooms, computeWalls, furnitureFits, resolveFurniturePlacement, clearances, fittedAuto } from './geometry.js';
import { Icon } from './ui.jsx';

const CAT_COLOR = {
  salon: '#10b981', comedor: '#14b8a6', dormitorio: '#8b5cf6',
  cocina: '#f97316', bano: '#3b82f6', oficina: '#0ea5e9', deco: '#a3a3a3',
};

const snapRoom = (v) => Math.round(v / 0.25) * 0.25;

function toSvg(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: p.x, z: p.y };
}

function roomItems(room) {
  return (room.furniture || []).map((f) => {
    const c = FURNITURE_BY_KEY[f.key] || { w: 0.5, d: 0.5 };
    return { ...f, w: c.w, d: c.d };
  });
}

export default function PlanEditor({
  rooms, planModel, planErrors = [], selectedId, onSelect,
  plantas = 1, activeLevel = 0, setActiveLevel, onRotateRoom,
  onBakeAll, onAddFurniture, onMoveFurniture, onRotateFurniture, onRemoveFurniture,
  onAutoFurnish, onClearFurniture,
}) {
  const svgRef = useRef(null);
  const placed = useMemo(
    () => placeRooms(rooms).filter((r) => plantas <= 1 || (r.level || 0) === activeLevel),
    [rooms, plantas, activeLevel]
  );
  const walls = useMemo(() => computeWalls(placed), [placed]);
  const [drag, setDrag] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [selFurn, setSelFurn] = useState(null);
  const [cat, setCat] = useState('salon');
  const [showPalette, setShowPalette] = useState(true);
  const [dockPalette, setDockPalette] = useState(true);

  const bounds = useMemo(() => {
    if (!placed.length) return { minX: -5, minZ: -5, spanX: 10, spanZ: 10 };
    const xs = placed.flatMap((r) => [r.cx - r.width / 2, r.cx + r.width / 2]);
    const zs = placed.flatMap((r) => [r.cz - r.length / 2, r.cz + r.length / 2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    return { minX, minZ, spanX: maxX - minX, spanZ: maxZ - minZ };
  }, [placed]);
  const pad = 1.5;

  const roomAt = (p) => {
    const index = placed.findIndex((r) => Math.abs(p.x - r.cx) <= r.width / 2 && Math.abs(p.z - r.cz) <= r.length / 2);
    return index >= 0 ? { ...placed[index], _walls: walls[index] } : null;
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const p = toSvg(svg, e);
      if (drag.mode === 'room') {
        const positions = {};
        placed.forEach((r) => { positions[r.id] = { cx: r.cx, cz: r.cz }; });
        positions[drag.id] = { cx: snapRoom(p.x - drag.dx), cz: snapRoom(p.z - drag.dz) };
        setDrag({ ...drag, preview: positions });
      } else if (drag.mode === 'move') {
        const index = placed.findIndex((r) => r.id === drag.roomId);
        const room = index >= 0 ? { ...placed[index], _walls: walls[index] } : null;
        if (!room) return;
        const item = FURNITURE_BY_KEY[drag.key];
        const placement = resolveFurniturePlacement(room, item, p.x - room.cx, p.z - room.cz, drag.rot);
        const lx = placement.x;
        const lz = placement.z;
        const others = roomItems(room).filter((o) => o.id !== drag.fid);
        const ok = furnitureFits(room, item, lx, lz, drag.rot, others);
        const cl = clearances(room, item, lx, lz, drag.rot);
        setDrag({ ...drag, lx, lz, ok, clear: cl });
      }
    };
    const up = () => {
      if (drag.mode === 'room' && drag.preview) onBakeAll(drag.preview);
      if (drag.mode === 'move' && drag.ok) onMoveFurniture(drag.roomId, drag.fid, drag.lx, drag.lz);
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag, placed, walls, onBakeAll, onMoveFurniture]);

  useEffect(() => {
    if (!ghost) return;
    const move = (e) => {
      const svg = svgRef.current;
      let valid = false;
      let allowed = true;
      let room = null;
      let lx = 0;
      let lz = 0;
      let minClear = 0;
      if (svg) {
        const p = toSvg(svg, e);
        room = roomAt(p);
        if (room) {
          const item = FURNITURE_BY_KEY[ghost.key];
          const placement = resolveFurniturePlacement(room, item, p.x - room.cx, p.z - room.cz, 0);
          lx = placement.x;
          lz = placement.z;
          allowed = furnitureAllowed(room.type, ghost.key);
          valid = allowed && furnitureFits(room, item, lx, lz, 0, roomItems(room));
          const cl = clearances(room, item, lx, lz, 0);
          minClear = Math.min(cl.izq, cl.der, cl.fondo, cl.frente);
        }
      }
      setGhost({ ...ghost, cx: e.clientX, cy: e.clientY, room: room?.id, lx, lz, valid, allowed, minClear });
    };
    const up = () => {
      if (ghost.room && ghost.valid) onAddFurniture(ghost.room, ghost.key, ghost.lx, ghost.lz, 0);
      setGhost(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [ghost, placed, walls, onAddFurniture]);

  useEffect(() => {
    const syncPaletteLayout = () => {
      const nextDock = window.innerWidth >= 1480;
      setDockPalette(nextDock);
      setShowPalette(nextDock);
    };

    syncPaletteLayout();
    window.addEventListener('resize', syncPaletteLayout);
    return () => window.removeEventListener('resize', syncPaletteLayout);
  }, []);

  const positions = drag?.mode === 'room' && drag.preview ? drag.preview : null;
  const activeSheet = planModel?.sheets?.find((sheet) => sheet.level === activeLevel) || planModel?.sheets?.[0] || null;
  const selRoom = placed.find((r) => r.id === selectedId);
  const allowedCats = selRoom ? catsFor(selRoom.type) : Object.keys(FURNITURE_CATS);
  const cats = Object.entries(FURNITURE_CATS).filter(([k]) => allowedCats.includes(k));
  const activeCat = allowedCats.includes(cat) ? cat : allowedCats[0];
  const catItems = FURNITURE_CATALOG.filter((f) => f.cat === activeCat);

  const palettePanel = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-3 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-700">Mobiliario</p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {selRoom ? `Compatible con ${ROOM_TYPES[selRoom.type].label}` : 'Selecciona una zona para filtrar'}
          </p>
        </div>
        {!dockPalette && (
          <button
            onClick={() => setShowPalette(false)}
            className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
            aria-label="Cerrar mobiliario"
          >
            <Icon name="chevron-right" size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 p-2">
        {cats.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setCat(k)}
            className={`rounded-full border px-2 py-1 text-[10px] font-medium transition-colors ${activeCat === k ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3">
        {catItems.map((f) => (
          <button
            key={f.key}
            onPointerDown={(e) => {
              e.preventDefault();
              setSelFurn(null);
              setGhost({ key: f.key, cx: e.clientX, cy: e.clientY, valid: false });
            }}
            className="flex min-h-[96px] cursor-grab flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            style={{ touchAction: 'none' }}
          >
            <span className="h-6 w-8 rounded" style={{ background: `${CAT_COLOR[f.cat] || '#64748b'}33`, border: `1px solid ${CAT_COLOR[f.cat] || '#64748b'}` }} />
            <span className="text-[11px] leading-tight text-zinc-700">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 flex bg-zinc-100">
      <div className="relative flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="h-full w-full touch-none select-none"
          viewBox={`${bounds.minX - pad} ${bounds.minZ - pad} ${bounds.spanX + 2 * pad} ${bounds.spanZ + 2 * pad}`}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              onSelect(null);
              setSelFurn(null);
            }
          }}
        >
          <defs>
            <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M1 0 L0 0 0 1" fill="none" stroke="#e2e8f0" strokeWidth="0.02" />
            </pattern>
          </defs>
          <rect x={bounds.minX - pad} y={bounds.minZ - pad} width={bounds.spanX + 2 * pad} height={bounds.spanZ + 2 * pad} fill="url(#grid)" />

          {activeSheet && (
            <g opacity="0.92">
              {activeSheet.dimensions.map((dimension, index) => (
                <g key={`dim-${index}`}>
                  <line
                    x1={dimension.start.x}
                    y1={dimension.start.y}
                    x2={dimension.end.x}
                    y2={dimension.end.y}
                    stroke="#94a3b8"
                    strokeWidth="0.03"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={(dimension.start.x + dimension.end.x) / 2}
                    y={(dimension.start.y + dimension.end.y) / 2 - 0.08}
                    textAnchor="middle"
                    fontSize={0.18}
                    fill="#475569"
                    style={{ pointerEvents: 'none' }}
                  >
                    {dimension.text}
                  </text>
                </g>
              ))}
            </g>
          )}

          {placed.map((r) => {
            const pos = positions?.[r.id] || { cx: r.cx, cz: r.cz };
            const t = ROOM_TYPES[r.type];
            const sel = r.id === selectedId;
            const x = pos.cx - r.width / 2;
            const y = pos.cz - r.length / 2;
            const items = roomItems(r);
            const showAuto = items.length === 0 && r.services?.mobiliario?.on;
            const autoItems = showAuto
              ? fittedAuto(r.type, r.width, r.length).map((f) => ({ ...f, w: FURNITURE_BY_KEY[f.key]?.w || 0.5, d: FURNITURE_BY_KEY[f.key]?.d || 0.5 }))
              : [];

            return (
              <g key={r.id}>
                <rect
                  x={x}
                  y={y}
                  width={r.width}
                  height={r.length}
                  rx={0.05}
                  fill={t.color}
                  fillOpacity={sel ? 0.3 : 0.15}
                  stroke={sel ? '#4f46e5' : t.color}
                  strokeWidth={sel ? 0.08 : 0.05}
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelect(r.id);
                    setSelFurn(null);
                    const p = toSvg(svgRef.current, e);
                    setDrag({ mode: 'room', id: r.id, dx: p.x - pos.cx, dz: p.z - pos.cz });
                  }}
                />
                <text x={pos.cx} y={y + 0.45} textAnchor="middle" fontSize={0.35} fontWeight="700" fill="#334155" style={{ pointerEvents: 'none' }}>
                  {t.label} · {(r.width * r.length).toFixed(1)} m²
                </text>

                {autoItems.map((f, i) => {
                  const deg = (f.rot || 0) * 180 / Math.PI;
                  const exportable = showsInPlan(f.key);
                  return (
                    <rect
                      key={`au${i}`}
                      x={-f.w / 2}
                      y={-f.d / 2}
                      width={f.w}
                      height={f.d}
                      rx={0.03}
                      transform={`translate(${pos.cx + f.px} ${pos.cz + f.pz}) rotate(${deg})`}
                      fill={CAT_COLOR[FURNITURE_BY_KEY[f.key]?.cat] || '#94a3b8'}
                      fillOpacity={exportable ? 0.25 : 0.12}
                      stroke={exportable ? '#94a3b8' : '#cbd5e1'}
                      strokeWidth={0.02}
                      strokeDasharray={exportable ? '0.1 0.08' : '0.04 0.06'}
                      vectorEffect="non-scaling-stroke"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })}

                {items.map((f) => {
                  const isDragged = drag?.mode === 'move' && drag.fid === f.id;
                  const lx = isDragged ? drag.lx : f.px;
                  const lz = isDragged ? drag.lz : f.pz;
                  const deg = (f.rot || 0) * 180 / Math.PI;
                  const isSel = selFurn?.fid === f.id;
                  const col = CAT_COLOR[FURNITURE_BY_KEY[f.key]?.cat] || '#64748b';
                  const exportable = showsInPlan(f.key);
                  return (
                    <g key={f.id} transform={`translate(${pos.cx + lx} ${pos.cz + lz}) rotate(${deg})`}>
                      <rect
                        x={-f.w / 2}
                        y={-f.d / 2}
                        width={f.w}
                        height={f.d}
                        rx={0.03}
                        fill={isDragged && !drag.ok ? '#ef4444' : col}
                        fillOpacity={isDragged ? 0.55 : exportable ? 0.85 : 0.35}
                        stroke={isSel ? '#fff' : '#1e293b'}
                        strokeWidth={isSel ? 0.06 : 0.03}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray={exportable ? undefined : '0.08 0.06'}
                        style={{ cursor: 'grab' }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          onSelect(r.id);
                          setSelFurn({ roomId: r.id, fid: f.id });
                          setDrag({ mode: 'move', roomId: r.id, fid: f.id, key: f.key, rot: f.rot || 0, lx: f.px, lz: f.pz, ok: true });
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          onRotateFurniture(r.id, f.id);
                        }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {selFurn && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white shadow-lg">
            <span className="text-xs text-zinc-400">Mueble</span>
            <button onClick={() => onRotateFurniture(selFurn.roomId, selFurn.fid)} className="flex items-center gap-1 hover:text-indigo-300"><Icon name="rotate-cw" size={15} /> Rotar</button>
            <button onClick={() => { onRemoveFurniture(selFurn.roomId, selFurn.fid); setSelFurn(null); }} className="flex items-center gap-1 hover:text-red-400"><Icon name="trash-2" size={15} /> Quitar</button>
          </div>
        )}

        {plantas > 1 && (
          <div className="absolute left-3 top-3 flex rounded-md border border-zinc-200 bg-white p-0.5 shadow">
            {Array.from({ length: plantas }).map((_, lv) => (
              <button
                key={lv}
                onClick={() => setActiveLevel(lv)}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${activeLevel === lv ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}
              >
                <Icon name="layers" size={12} /> {lv === 0 ? 'Baja' : `P${lv}`}
              </button>
            ))}
          </div>
        )}

        {selectedId && (
          <div className="absolute left-3 flex flex-wrap gap-2" style={{ top: plantas > 1 ? 48 : 12 }}>
            <button onClick={() => onRotateRoom(selectedId)} className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow hover:bg-zinc-50"><Icon name="rotate-cw" size={13} /> Rotar zona</button>
            <button onClick={() => onAutoFurnish(selectedId)} className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow hover:bg-zinc-50"><Icon name="wand-sparkles" size={13} /> Auto-amueblar</button>
            <button onClick={() => onClearFurniture(selectedId)} className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow hover:bg-zinc-50"><Icon name="eraser" size={13} /> Vaciar</button>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          {!dockPalette && (
            <button
              onClick={() => setShowPalette(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-xs font-semibold text-zinc-700 shadow hover:bg-zinc-50"
            >
              <Icon name="armchair" size={13} />
              Mobiliario
            </button>
          )}
          <div className="rounded-md border border-zinc-200 bg-white/95 px-3 py-2 text-[11px] text-zinc-600 shadow">
            La planta muestra cotas y atenúa los elementos que no salen en la exportación.
          </div>
          {planErrors.length > 0 && (
            <div className="max-w-[280px] rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 shadow">
              {planErrors[0].message}
            </div>
          )}
        </div>
      </div>

      {dockPalette && (
        <div className="w-[250px] shrink-0 border-l border-zinc-200 shadow-[inset_1px_0_0_rgba(226,232,240,0.8)]">
          {palettePanel}
        </div>
      )}

      {!dockPalette && showPalette && (
        <>
          <div className="absolute inset-0 z-30 bg-zinc-950/20 backdrop-blur-[1px]" onClick={() => setShowPalette(false)} />
          <div className="absolute inset-y-0 right-0 z-40 w-[min(320px,92vw)] border-l border-zinc-200 bg-white shadow-2xl">
            {palettePanel}
          </div>
        </>
      )}

      {drag?.mode === 'move' && drag.clear && (
        <div className="absolute bottom-3 left-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] text-white shadow-lg -translate-x-1/2">
          Holgura · izq {drag.clear.izq.toFixed(2)} · der {drag.clear.der.toFixed(2)} · fondo {drag.clear.fondo.toFixed(2)} · frente {drag.clear.frente.toFixed(2)} m
          {!drag.ok && <span className="text-red-300"> · no cabe</span>}
        </div>
      )}

      {ghost && (
        <div
          className="pointer-events-none fixed z-50 rounded px-2 py-1 text-[11px] font-medium text-white shadow-lg"
          style={{ left: ghost.cx + 10, top: ghost.cy + 10, background: ghost.room ? (ghost.valid ? '#16a34a' : '#ef4444') : '#3f3f46' }}
        >
          {FURNITURE_BY_KEY[ghost.key]?.label}
          {ghost.room
            ? (!ghost.allowed ? ' · no va en esta zona'
              : ghost.valid ? ` · holgura ${(ghost.minClear ?? 0).toFixed(2)} m`
              : ' · no cabe')
            : ''}
        </div>
      )}
    </div>
  );
}
