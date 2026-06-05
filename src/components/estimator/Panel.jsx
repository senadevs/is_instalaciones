import { useState, useMemo } from 'react';
import {
  ROOM_TYPES, VIVIENDAS, FINISHES, REFORMS, DOOR_KINDS,
  SERVICES, EXTRAS, PAINT_PRESETS, LED_PRESETS, zonasFor, servicesFor,
  FURNITURE_CATALOG, FURNITURE_CATS, WINDOW_KINDS,
} from './catalog.js';
import { Icon, Toggle, Chip, ColorRow } from './ui.jsx';

const SIDES = [['n', 'Norte'], ['s', 'Sur'], ['e', 'Este'], ['w', 'Oeste']];
const OPENING_OPTS = [
  ['', 'Auto'],
  ...Object.entries(DOOR_KINDS).map(([k, v]) => [k, v.label]),
  ...Object.entries(WINDOW_KINDS).map(([k, v]) => ['win:' + k, v.label]),
  ['none', 'Tapiada'],
];
const AMERICAN = ['salon', 'comedor', 'cocina'];

const inp = 'w-full px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition';
const lbl = 'block text-[11px] font-medium text-gray-500 mb-1';

// Índice de búsqueda: servicios+opciones y elementos de mobiliario.
const SEARCH_INDEX = [
  ...Object.entries(SERVICES).flatMap(([k, svc]) =>
    svc.opts.map((o) => ({ type: 'svc', svcKey: k, optKey: o.key, label: o.label, group: svc.label, icon: svc.icon, color: svc.color }))
  ),
  ...FURNITURE_CATALOG.map((f) => ({ type: 'item', label: f.label, group: FURNITURE_CATS[f.cat] || 'Mobiliario', cat: f.cat, icon: 'lucide:armchair', color: '#64748b' })),
];

function Node({ icon, iconColor, title, badge, open, onToggle, children, right }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 transition-colors text-left">
        <span className="grid place-items-center w-6 h-6 rounded-md shrink-0" style={{ background: (iconColor || '#64748b') + '22', color: iconColor || '#475569' }}>
          <Icon name={icon} size={14} />
        </span>
        <span className="text-sm font-semibold text-slate-800 truncate flex-1">{title}</span>
        {badge && <span className="text-[10px] text-gray-400 shrink-0">{badge}</span>}
        {right}
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={15} className="text-gray-400 shrink-0" />
      </button>
      {open && <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3 bg-white/40">{children}</div>}
    </div>
  );
}

export default function Panel({
  setup, setSetup, onVivienda, rooms, totalM2,
  plantas = 1, activeLevel = 0, setActiveLevel,
  selectedId, setSelectedId, addType, setAddType,
  onAdd, onRemove, onUpdate, onRotateRoom, onToggleService, onToggleOpt, onSetOpening,
  interior, onEnterInterior, onSolicitar, onScaleArea, onShowPlan, onDownloadPlan,
}) {
  const [openInmueble, setOpenInmueble] = useState(true);
  const [query, setQuery] = useState('');

  const zonas = zonasFor(setup.vivienda);
  // Si el tipo a añadir no es válido para esta vivienda, ajústalo.
  const addOptions = zonas;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter((r) => r.label.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  const applyResult = (r) => {
    if (r.type === 'svc') {
      if (!selectedId) { alert('Selecciona primero una zona para aplicar el servicio.'); return; }
      onToggleOpt(selectedId, r.svcKey, r.optKey);
    } else {
      onShowPlan?.();
    }
    setQuery('');
  };

  return (
    <aside className="w-full lg:w-[390px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Marca + buscador */}
      <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary"><Icon name="box" size={16} /></span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800">Configurador 3D</p>
            <p className="text-[10px] text-gray-500">{rooms.length} zonas · {totalM2.toFixed(1)} m²</p>
          </div>
        </div>
        <div className="relative">
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar servicio o elemento…"
            className={`${inp} pl-8`} />
          {results.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} onClick={() => applyResult(r)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                  <span className="grid place-items-center w-5 h-5 rounded shrink-0" style={{ color: r.color }}><Icon name={r.icon} size={13} /></span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{r.label}</span>
                  <span className="text-[10px] text-gray-400">{r.type === 'svc' ? r.group : 'elemento'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 1 · INMUEBLE */}
        <Node icon="house" iconColor="#046a53" title="Inmueble" open={openInmueble} onToggle={() => setOpenInmueble(!openInmueble)}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Tipo</label>
              <select className={inp} value={setup.vivienda} onChange={(e) => onVivienda(e.target.value)}>
                {Object.entries(VIVIENDAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Superficie m²</label>
              <div className="flex gap-1">
                <input type="number" min="20" max="800" className={inp} value={setup.m2}
                  onChange={(e) => setSetup({ ...setup, m2: e.target.value })}
                  onBlur={onScaleArea} title="Al cambiar la superficie, las zonas se reparten para sumar el total" />
                <button onClick={onScaleArea} title="Repartir esta superficie entre las zonas" className="shrink-0 px-2 rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"><Icon name="scaling" size={15} /></button>
              </div>
            </div>
          </div>
          {VIVIENDAS[setup.vivienda]?.garden && (
            <p className="text-[11px] text-green-600 flex items-center gap-1"><Icon name="trees" size={12} /> Con jardín: piscina, jacuzzi y terraza disponibles.</p>
          )}
          <div>
            <label className={lbl}>Extras del inmueble</label>
            <div className="flex flex-wrap gap-1.5">
              {EXTRAS.map((e) => (
                <Chip key={e.key} active={!!setup.extras?.[e.key]}
                  onClick={() => setSetup({ ...setup, extras: { ...setup.extras, [e.key]: !setup.extras?.[e.key] } })}>
                  {e.label}
                </Chip>
              ))}
            </div>
          </div>
        </Node>

        {/* Selector de planta (dúplex / casa) */}
        {plantas > 1 && (
          <div className="flex gap-1.5">
            {Array.from({ length: plantas }).map((_, lv) => (
              <button key={lv} onClick={() => setActiveLevel(lv)}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-md border transition-colors ${activeLevel === lv ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                <Icon name="layers" size={13} /> {lv === 0 ? 'Planta baja' : `Planta ${lv}`}
              </button>
            ))}
          </div>
        )}

        {/* 2 · AÑADIR ZONA (filtrada por tipo de inmueble) */}
        <div className="flex gap-2">
          <select className={inp} value={addOptions.includes(addType) ? addType : addOptions[0]} onChange={(e) => setAddType(e.target.value)}>
            {addOptions.map((k) => <option key={k} value={k}>{ROOM_TYPES[k].label}</option>)}
          </select>
          <button onClick={() => onAdd(addOptions.includes(addType) ? addType : addOptions[0])} className="flex items-center gap-1 bg-primary hover:bg-secondary text-white text-sm font-semibold px-3 rounded-md transition-colors shrink-0">
            <Icon name="plus" size={15} /> Zona
          </button>
        </div>

        {/* 3 · ZONAS */}
        <div className="space-y-2">
          {rooms.filter((r) => plantas <= 1 || (r.level || 0) === activeLevel).map((r) => {
            const t = ROOM_TYPES[r.type];
            const open = selectedId === r.id;
            const canAmerican = AMERICAN.includes(r.type);
            return (
              <Node key={r.id} icon={t.icon} iconColor={t.color}
                title={t.label} badge={`${(r.width * r.length).toFixed(1)} m²`}
                open={open} onToggle={() => setSelectedId(open ? null : r.id)}
                right={
                  <button onClick={(e) => { e.stopPropagation(); onRemove(r.id); }} className="text-gray-300 hover:text-red-500 shrink-0" aria-label="Eliminar">
                    <Icon name="trash-2" size={14} />
                  </button>
                }>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={lbl}>Ancho</label><input type="number" min="1" max="20" step="0.5" className={inp} value={r.width} onChange={(e) => onUpdate(r.id, { width: Number(e.target.value) })} /></div>
                  <div><label className={lbl}>Largo</label><input type="number" min="1" max="20" step="0.5" className={inp} value={r.length} onChange={(e) => onUpdate(r.id, { length: Number(e.target.value) })} /></div>
                  <div><label className={lbl}>Alto</label><input type="number" min="2" max="4" step="0.1" className={inp} value={r.height} onChange={(e) => onUpdate(r.id, { height: Number(e.target.value) })} /></div>
                </div>
                <button onClick={() => onRotateRoom(r.id)} className="flex items-center justify-center gap-1.5 w-full text-[12px] font-medium py-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                  <Icon name="rotate-cw" size={13} /> Rotar zona (orientar pasillo)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lbl}>Reforma</label><select className={inp} value={r.reform} onChange={(e) => onUpdate(r.id, { reform: e.target.value })}>{Object.entries(REFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label className={lbl}>Acabado</label><select className={inp} value={r.finish} onChange={(e) => onUpdate(r.id, { finish: e.target.value })}>{Object.entries(FINISHES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                </div>

                {t.shape === 'room' && (
                  <div>
                    <label className={lbl}>Puertas y aberturas (por pared)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SIDES.map(([side, name]) => {
                        const ov = r.openings?.[side];
                        return (
                          <div key={side} className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 w-9 shrink-0">{name}</span>
                            <select className={`${inp} !py-1 text-[11px]`} value={ov?.kind || ''}
                              onChange={(e) => onSetOpening(r.id, side, e.target.value ? { kind: e.target.value, width: ov?.width || DOOR_KINDS[e.target.value]?.w } : null)}>
                              {OPENING_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </select>
                            {ov && ov.kind !== 'none' && ov.kind !== 'window' && !ov.kind.startsWith('win:') && (
                              <input type="number" min="0.6" max="3" step="0.1" className={`${inp} !py-1 !px-1.5 w-14 text-[11px]`} value={ov.width}
                                onChange={(e) => onSetOpening(r.id, side, { kind: ov.kind, width: Number(e.target.value) })} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {canAmerican && (
                      <label className="flex items-center gap-2 mt-2 text-[12px] text-slate-600 cursor-pointer">
                        <Toggle on={!!r.openKitchen} onChange={(v) => onUpdate(r.id, { openKitchen: v })} />
                        Cocina americana (abrir a salón/comedor)
                      </label>
                    )}
                  </div>
                )}

                {/* SERVICIOS */}
                <div>
                  <label className={lbl}>Servicios</label>
                  <div className="space-y-1.5">
                    {Object.entries(SERVICES).filter(([svcKey]) => servicesFor(r.type).includes(svcKey)).map(([svcKey, svc]) => {
                      const s = r.services?.[svcKey] || {};
                      return (
                        <div key={svcKey} className="rounded-md border border-gray-100 bg-white">
                          <div className="flex items-center gap-2 px-2.5 py-1.5">
                            <span className="grid place-items-center w-5 h-5 rounded" style={{ color: svc.color }}><Icon name={svc.icon} size={13} /></span>
                            <span className="text-[12px] font-medium text-slate-700 flex-1">{svc.label}</span>
                            <Toggle on={!!s.on} onChange={() => onToggleService(r.id, svcKey)} />
                          </div>
                          {s.on && svc.opts.length > 0 && (
                            <div className="px-2.5 pb-2.5 pt-0.5 space-y-2 border-t border-gray-50">
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {svc.opts.map((o) => (
                                  <Chip key={o.key} active={!!s[o.key]} onClick={() => onToggleOpt(r.id, svcKey, o.key)}>{o.label}</Chip>
                                ))}
                              </div>
                              {svcKey === 'electricidad' && s.led && (
                                <div><span className={lbl}>Color de luz LED</span><ColorRow value={r.led} presets={LED_PRESETS} onChange={(c) => onUpdate(r.id, { led: c })} /></div>
                              )}
                              {svcKey === 'revestimientos' && s.pintura && (
                                <div><span className={lbl}>Color de pintura</span><ColorRow value={r.paint} presets={PAINT_PRESETS} onChange={(c) => onUpdate(r.id, { paint: c })} /></div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => onEnterInterior(open && interior === r.id ? null : r.id)}
                  className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                  <Icon name={interior === r.id ? 'log-out' : 'eye'} size={14} />
                  {interior === r.id ? 'Salir de la vista interior' : 'Ver por dentro'}
                </button>
              </Node>
            );
          })}
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-primary p-4 text-center">
          <p className="text-[13px] text-white/90 mb-3">Presupuesto <strong>gratuito</strong> tras visita técnica. Sin compromiso.</p>
          <button onClick={onSolicitar} disabled={!rooms.length} className="w-full flex items-center justify-center gap-2 bg-white text-primary font-bold py-2.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50">
            <Icon name="message-circle" size={16} /> Solicitar presupuesto
          </button>
          <button onClick={onDownloadPlan} disabled={!rooms.length} className="w-full flex items-center justify-center gap-2 mt-2 bg-primary/20 text-white font-semibold py-2 rounded-md hover:bg-white/20 transition-colors disabled:opacity-50">
            <Icon name="download" size={15} /> Plano en PDF
          </button>
        </div>
      </div>
    </aside>
  );
}
