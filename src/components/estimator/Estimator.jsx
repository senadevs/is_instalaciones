import { useState, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html, ContactShadows, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Model, getFurniture } from './models.jsx';

// ---- Catálogos ----
const TYPES = {
  salon: { label: 'Salón', color: '#10b981', def: [5, 4], shape: 'room' },
  cocina: { label: 'Cocina', color: '#f97316', def: [3, 3], shape: 'room' },
  bano: { label: 'Baño', color: '#3b82f6', def: [2, 2.5], shape: 'room' },
  dormitorio: { label: 'Dormitorio', color: '#8b5cf6', def: [4, 3.5], shape: 'room' },
  comedor: { label: 'Comedor', color: '#14b8a6', def: [4, 4], shape: 'room' },
  pasillo: { label: 'Pasillo', color: '#eab308', def: [3, 1.5], shape: 'room' },
  oficina: { label: 'Oficina', color: '#0ea5e9', def: [3, 3], shape: 'room' },
  terraza: { label: 'Terraza', color: '#84cc16', def: [4, 3], shape: 'terraza' },
  piscina: { label: 'Piscina', color: '#06b6d4', def: [6, 3], shape: 'piscina' },
  jacuzzi: { label: 'Jacuzzi', color: '#22d3ee', def: [2.5, 2.5], shape: 'jacuzzi' },
};
const FINISHES = { estandar: 'Estándar', medio: 'Medio', premium: 'Premium' };
const REFORMS = { integral: 'Integral', parcial: 'Parcial' };
const WORKS = [
  { key: 'led', label: 'Iluminación LED' },
  { key: 'electricidad', label: 'Electricidad' },
  { key: 'fontaneria', label: 'Fontanería' },
  { key: 'climatizacion', label: 'Aire / climatización' },
  { key: 'alicatado', label: 'Alicatado / solado' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'puertas', label: 'Puertas' },
  { key: 'ventanas', label: 'Ventanas' },
  { key: 'mobiliario', label: 'Mobiliario' },
];
const EXTRAS = [
  { key: 'fotovoltaica', label: 'Placas fotovoltaicas' },
  { key: 'videoportero', label: 'Videoportero' },
  { key: 'domotica', label: 'Domótica' },
];
const VIVIENDAS = { piso: 'Piso', casa: 'Casa', duplex: 'Dúplex', local: 'Local', oficina: 'Oficina' };
const PAINT_PRESETS = ['#ffffff', '#f1f5f9', '#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#ddd6fe', '#fed7aa'];
const LED_PRESETS = ['#fff7cc', '#ffffff', '#bfdbfe', '#fde68a', '#fca5a5', '#bbf7d0'];
const WALL_DEFAULT = '#ece9e3';

let uid = 1;
function newRoom(type) {
  const d = TYPES[type].def;
  return { id: uid++, type, width: d[0], length: d[1], height: 2.6, reform: 'integral', finish: 'medio', paint: '#f1f5f9', led: '#fff7cc', works: { led: true, pintura: true, mobiliario: true } };
}

// ---- Auto-disposición (sin hueco, para que las paredes sean contiguas) ----
function layout(rooms) {
  const maxRow = 13;
  let x = 0, z = 0, rowDepth = 0;
  const placed = rooms.map((r) => {
    if (x + r.width > maxRow && x > 0) { x = 0; z += rowDepth; rowDepth = 0; }
    const p = { ...r, px: x, pz: z };
    x += r.width; rowDepth = Math.max(rowDepth, r.length);
    return p;
  });
  if (placed.length) {
    const maxX = Math.max(...placed.map((r) => r.px + r.width));
    const maxZ = Math.max(...placed.map((r) => r.pz + r.length));
    placed.forEach((r) => { r.cx = r.px + r.width / 2 - maxX / 2; r.cz = r.pz + r.length / 2 - maxZ / 2; });
  }
  return placed;
}

// Para cada estancia, marca qué paredes son interiores (hay vecina) o exteriores
function computeWalls(placed) {
  const eps = 0.06;
  return placed.map((a, i) => {
    const w = { n: 'ext', s: 'ext', e: 'ext', w: 'ext' };
    const aL = a.cx - a.width / 2, aR = a.cx + a.width / 2, aN = a.cz - a.length / 2, aS = a.cz + a.length / 2;
    placed.forEach((b, j) => {
      if (i === j) return;
      const bL = b.cx - b.width / 2, bR = b.cx + b.width / 2, bN = b.cz - b.length / 2, bS = b.cz + b.length / 2;
      const zOv = Math.min(aS, bS) - Math.max(aN, bN) > 0.5;
      const xOv = Math.min(aR, bR) - Math.max(aL, bL) > 0.5;
      if (Math.abs(aR - bL) < eps && zOv) w.e = 'int';
      if (Math.abs(aL - bR) < eps && zOv) w.w = 'int';
      if (Math.abs(aS - bN) < eps && xOv) w.s = 'int';
      if (Math.abs(aN - bS) < eps && xOv) w.n = 'int';
    });
    return w;
  });
}

// ---- Pared con hueco (puerta o ventana) ----
function Wall({ len, h, opening = 'none', color = WALL_DEFAULT, thick = 0.1 }) {
  const openW = opening === 'door' ? 0.9 : opening === 'window' ? Math.min(1.4, len * 0.5) : 0;
  const openBottom = opening === 'window' ? 0.9 : 0;
  const openTop = opening === 'door' ? 2.05 : opening === 'window' ? 2.0 : 0;
  const sideW = (len - openW) / 2;
  const wallMat = <meshStandardMaterial color={color} roughness={0.92} />;
  return (
    <group>
      {openW === 0 ? (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[len, h, thick]} />{wallMat}</mesh>
      ) : (
        <>
          <mesh position={[-(openW + sideW) / 2, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[sideW, h, thick]} />{wallMat}</mesh>
          <mesh position={[(openW + sideW) / 2, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[sideW, h, thick]} />{wallMat}</mesh>
          {openBottom > 0 && <mesh position={[0, openBottom / 2, 0]} castShadow receiveShadow><boxGeometry args={[openW, openBottom, thick]} />{wallMat}</mesh>}
          {openTop < h && <mesh position={[0, (openTop + h) / 2, 0]} castShadow receiveShadow><boxGeometry args={[openW, h - openTop, thick]} />{wallMat}</mesh>}
          {opening === 'window' && (
            <mesh position={[0, (openBottom + openTop) / 2, 0]}>
              <boxGeometry args={[openW, openTop - openBottom, 0.04]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.45} roughness={0.05} metalness={0.4} emissive="#7dd3fc" emissiveIntensity={0.15} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

function Room({ room, walls, entrance, selected, onSelect, onEnter }) {
  const { width: w, length: l, height: h, type, finish, works = {} } = room;
  const shape = TYPES[type].shape;
  const color = TYPES[type].color;
  const wallColor = works.pintura ? room.paint : WALL_DEFAULT;
  const floorRough = finish === 'premium' ? 0.25 : finish === 'medio' ? 0.6 : 0.95;
  const floorMetal = finish === 'premium' ? 0.2 : 0.05;

  // Tipo de apertura por pared
  const op = (side) => {
    if (entrance && entrance.side === side) return 'door';
    if (walls[side] === 'int') return 'door';
    if (walls[side] === 'ext' && works.ventanas) return 'window';
    return 'none';
  };

  return (
    <group position={[room.cx, 0, room.cz]}
      onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEnter(room.id); }}>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color={selected ? '#dbeafe' : color} roughness={floorRough} metalness={floorMetal} />
      </mesh>

      {shape === 'piscina' && (
        <mesh position={[0, -0.35, 0]}><boxGeometry args={[w * 0.82, 0.7, l * 0.82]} /><meshStandardMaterial color="#0891b2" roughness={0.1} metalness={0.3} transparent opacity={0.85} /></mesh>
      )}
      {shape === 'jacuzzi' && (
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[Math.min(w, l) / 2.3, Math.min(w, l) / 2.1, 0.6, 28]} /><meshStandardMaterial color="#06b6d4" roughness={0.15} metalness={0.3} /></mesh>
      )}

      {shape === 'room' && (
        <>
          <group position={[0, 0, -l / 2]}><Wall len={w} h={h} opening={op('n')} color={wallColor} /></group>
          <group position={[0, 0, l / 2]}><Wall len={w} h={h} opening={op('s')} color={wallColor} /></group>
          <group position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Wall len={l} h={h} opening={op('w')} color={wallColor} /></group>
          <group position={[w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Wall len={l} h={h} opening={op('e')} color={wallColor} /></group>

          {/* LED: plafón emisivo + luz del color elegido */}
          {works.led && (
            <>
              <mesh position={[0, h - 0.06, 0]}><cylinderGeometry args={[0.22, 0.22, 0.06, 20]} /><meshStandardMaterial color="#ffffff" emissive={room.led} emissiveIntensity={1.6} /></mesh>
              <pointLight position={[0, h - 0.3, 0]} color={room.led} intensity={6} distance={Math.max(w, l) * 1.6} decay={2} />
            </>
          )}
          {/* Aire acondicionado (split) */}
          {works.climatizacion && (
            <group position={[0, h - 0.45, -l / 2 + 0.12]}>
              <mesh castShadow><boxGeometry args={[0.9, 0.28, 0.22]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
              <mesh position={[0, -0.16, 0.02]}><boxGeometry args={[0.8, 0.04, 0.2]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
            </group>
          )}
          {/* Mobiliario GLTF */}
          {works.mobiliario && (
            <Suspense fallback={null}>
              {getFurniture(type, w, l).map((f, i) => (
                <Model key={i} url={f.url} position={f.position} rotation={f.rotation || [0, 0, 0]} scale={f.scale || 1} />
              ))}
            </Suspense>
          )}
        </>
      )}

      {shape === 'terraza' && (
        <>
          <group position={[0, 0, -l / 2]}><Wall len={w} h={1} color="#cbd5e1" thick={0.06} /></group>
          <group position={[0, 0, l / 2]}><Wall len={w} h={1} color="#cbd5e1" thick={0.06} /></group>
          <group position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Wall len={l} h={1} color="#cbd5e1" thick={0.06} /></group>
          <group position={[w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Wall len={l} h={1} color="#cbd5e1" thick={0.06} /></group>
          {works.mobiliario && (
            <Suspense fallback={null}>
              {getFurniture('terraza', w, l).map((f, i) => (<Model key={i} url={f.url} position={f.position} rotation={f.rotation || [0, 0, 0]} scale={f.scale || 1} />))}
            </Suspense>
          )}
        </>
      )}

      <Html position={[0, (shape === 'room' ? h : 1) + 0.3, 0]} center distanceFactor={16} zIndexRange={[20, 0]}>
        <div style={{ background: selected ? '#1d4ed8' : 'rgba(255,255,255,.94)', color: selected ? '#fff' : '#1f2937', padding: '3px 9px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,.18)', pointerEvents: 'none' }}>
          {TYPES[type].label} · {(w * l).toFixed(1)} m²
        </div>
      </Html>
    </group>
  );
}

function CameraRig({ interior }) {
  const { camera, controls } = useThree();
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  useFrame(() => {
    if (!interior) return;
    tPos.current.set(interior.cx - interior.width / 4, 1.6, interior.cz + interior.length / 4);
    tLook.current.set(interior.cx, 1.2, interior.cz);
    camera.position.lerp(tPos.current, 0.06);
    if (controls) { controls.target.lerp(tLook.current, 0.06); controls.update(); }
  });
  return null;
}

function Scene({ rooms, vivienda, selectedId, onSelect, interior, onEnter, totalSize }) {
  const placed = useMemo(() => layout(rooms), [rooms]);
  const walls = useMemo(() => computeWalls(placed), [placed]);
  const entrance = useMemo(() => {
    const pref = ['pasillo', 'salon', 'comedor'];
    let best = null;
    placed.forEach((r, i) => {
      ['s', 'n', 'e', 'w'].forEach((side) => {
        if (walls[i][side] !== 'ext') return;
        const score = (pref.indexOf(r.type) + 1 || 9) * 10 + (side === 's' ? 0 : 5);
        if (!best || score < best.score) best = { roomId: r.id, side, score };
      });
    });
    return best;
  }, [placed, walls]);

  const dist = Math.max(10, totalSize * 1.15);
  const isCasa = vivienda === 'casa';
  return (
    <Canvas shadows camera={{ position: [dist, dist * 0.85, dist], fov: 45 }} onPointerMissed={() => onSelect(null)}>
      <Sky sunPosition={[20, 30, 10]} turbidity={6} rayleigh={1} />
      <hemisphereLight args={['#ffffff', isCasa ? '#9ccc65' : '#cbd5e1', 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[18, 26, 12]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} />

      {/* Suelo: jardín (casa) o neutro */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color={isCasa ? '#86b94e' : '#e7e5e4'} roughness={1} />
      </mesh>
      <ContactShadows position={[0, 0.03, 0]} scale={Math.max(20, totalSize * 2.4)} blur={2.2} opacity={0.35} far={12} />
      <Grid infiniteGrid cellSize={1} sectionSize={5} cellColor={isCasa ? '#9ccc65' : '#cbd5e1'} sectionColor={isCasa ? '#7cb342' : '#94a3b8'} fadeDistance={70} fadeStrength={1.5} />

      {placed.map((r, i) => (
        <Room key={r.id} room={r} walls={walls[i]}
          entrance={entrance && entrance.roomId === r.id ? entrance : null}
          selected={r.id === selectedId} onSelect={onSelect} onEnter={onEnter} />
      ))}

      <CameraRig interior={interior ? placed.find((r) => r.id === interior) : null} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2} maxDistance={140} maxPolarAngle={Math.PI / 2.04} />
    </Canvas>
  );
}

export default function Estimator() {
  const [setup, setSetup] = useState({ vivienda: 'piso', m2: 80, notas: '' });
  const [rooms, setRooms] = useState([newRoom('salon'), newRoom('cocina'), newRoom('bano')]);
  const [extras, setExtras] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [interior, setInterior] = useState(null);
  const [addType, setAddType] = useState('dormitorio');

  const totalM2 = rooms.reduce((s, r) => s + r.width * r.length, 0);
  const totalSize = Math.max(9, Math.sqrt(totalM2) * 2.6);

  const addRoom = () => { const r = newRoom(addType); setRooms((rs) => [...rs, r]); setSelectedId(r.id); };
  const removeRoom = (id) => { setRooms((rs) => rs.filter((r) => r.id !== id)); if (selectedId === id) setSelectedId(null); if (interior === id) setInterior(null); };
  const updateRoom = (id, patch) => setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const toggleWork = (id, key) => setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, works: { ...r.works, [key]: !r.works?.[key] } } : r)));

  function solicitar() {
    let msg = `Hola, quiero presupuesto para reformar mi ${VIVIENDAS[setup.vivienda].toLowerCase()}`;
    if (setup.m2) msg += ` de unos ${setup.m2} m²`;
    msg += '. Configuración:\n\n';
    rooms.forEach((r, i) => {
      const works = WORKS.filter((w) => r.works?.[w.key]).map((w) => w.label).join(', ') || 'reforma general';
      msg += `${i + 1}. ${TYPES[r.type].label} — ${r.width}×${r.length} m (${(r.width * r.length).toFixed(1)} m²), ${REFORMS[r.reform].toLowerCase()}, acabado ${FINISHES[r.finish].toLowerCase()}. Trabajos: ${works}.\n`;
    });
    const ex = EXTRAS.filter((e) => extras[e.key]).map((e) => e.label);
    if (ex.length) msg += `\nExtras: ${ex.join(', ')}.`;
    if (setup.notas) msg += `\nNotas: ${setup.notas}`;
    msg += `\n\nTotal: ${rooms.length} estancias · ${totalM2.toFixed(1)} m². ¿Me dais presupuesto?`;
    window.open('https://wa.me/34637591736?text=' + encodeURIComponent(msg), '_blank');
  }

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition';
  const lbl = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] lg:h-[calc(100vh-7rem)] min-h-[560px] bg-gray-100">
      <aside className="w-full lg:w-[370px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">
        {/* 1. Vivienda */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">1. Tu vivienda</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Tipo</label>
              <select className={input} value={setup.vivienda} onChange={(e) => setSetup({ ...setup, vivienda: e.target.value })}>
                {Object.entries(VIVIENDAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Superficie (m²)</label>
              <input type="number" min="20" max="800" className={input} value={setup.m2} onChange={(e) => setSetup({ ...setup, m2: e.target.value })} />
            </div>
          </div>
          {setup.vivienda === 'casa' && <p className="text-xs text-green-600 mb-1">🌿 Casa con jardín: puedes añadir piscina, jacuzzi y terraza.</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXTRAS.map((e) => (
              <button key={e.key} onClick={() => setExtras({ ...extras, [e.key]: !extras[e.key] })}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${extras[e.key] ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>{e.label}</button>
            ))}
          </div>
        </div>

        {/* 2. Añadir */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">2. Añadir estancia</h3>
          <div className="flex gap-2">
            <select className={input} value={addType} onChange={(e) => setAddType(e.target.value)}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={addRoom} className="bg-primary text-white font-semibold px-4 rounded-lg hover:bg-secondary transition-colors shrink-0">+</button>
          </div>
        </div>

        {/* 3. Estancias */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">3. Estancias</h3>
            <span className="text-xs text-gray-500">{rooms.length} · {totalM2.toFixed(1)} m²</span>
          </div>
          <ul className="space-y-2">
            {rooms.map((r) => (
              <li key={r.id} className={`rounded-lg border transition ${selectedId === r.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center justify-between gap-2 p-2.5 cursor-pointer" onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: TYPES[r.type].color }}></span>
                    <span className="text-sm font-medium text-slate-800 truncate">{TYPES[r.type].label}</span>
                    <span className="text-xs text-gray-400">{(r.width * r.length).toFixed(1)} m²</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeRoom(r.id); }} className="text-gray-300 hover:text-red-500 shrink-0" aria-label="Eliminar">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  </button>
                </div>
                {selectedId === r.id && (
                  <div className="px-2.5 pb-3 pt-1 space-y-2.5 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className={lbl}>Ancho</label><input type="number" min="1" max="20" step="0.5" className={input} value={r.width} onChange={(e) => updateRoom(r.id, { width: Number(e.target.value) })} /></div>
                      <div><label className={lbl}>Largo</label><input type="number" min="1" max="20" step="0.5" className={input} value={r.length} onChange={(e) => updateRoom(r.id, { length: Number(e.target.value) })} /></div>
                      <div><label className={lbl}>Alto</label><input type="number" min="2" max="4" step="0.1" className={input} value={r.height} onChange={(e) => updateRoom(r.id, { height: Number(e.target.value) })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={lbl}>Reforma</label><select className={input} value={r.reform} onChange={(e) => updateRoom(r.id, { reform: e.target.value })}>{Object.entries(REFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                      <div><label className={lbl}>Acabado</label><select className={input} value={r.finish} onChange={(e) => updateRoom(r.id, { finish: e.target.value })}>{Object.entries(FINISHES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                    </div>
                    <div>
                      <label className={lbl}>Trabajos a realizar</label>
                      <div className="flex flex-wrap gap-1.5">
                        {WORKS.map((w) => (
                          <button key={w.key} onClick={() => toggleWork(r.id, w.key)} className={`text-xs px-2 py-1 rounded-full border transition ${r.works?.[w.key] ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>{w.label}</button>
                        ))}
                      </div>
                    </div>
                    {r.works?.pintura && (
                      <div>
                        <label className={lbl}>Color de pintura</label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {PAINT_PRESETS.map((c) => (
                            <button key={c} onClick={() => updateRoom(r.id, { paint: c })} className={`w-6 h-6 rounded-full border-2 ${r.paint === c ? 'border-primary' : 'border-white'}`} style={{ background: c, boxShadow: '0 0 0 1px #e5e7eb' }} />
                          ))}
                          <input type="color" value={r.paint} onChange={(e) => updateRoom(r.id, { paint: e.target.value })} className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                        </div>
                      </div>
                    )}
                    {r.works?.led && (
                      <div>
                        <label className={lbl}>Color de luz LED</label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {LED_PRESETS.map((c) => (
                            <button key={c} onClick={() => updateRoom(r.id, { led: c })} className={`w-6 h-6 rounded-full border-2 ${r.led === c ? 'border-primary' : 'border-white'}`} style={{ background: c, boxShadow: '0 0 0 1px #e5e7eb' }} />
                          ))}
                          <input type="color" value={r.led} onChange={(e) => updateRoom(r.id, { led: e.target.value })} className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                        </div>
                      </div>
                    )}
                    <button onClick={() => setInterior(interior === r.id ? null : r.id)} className="w-full text-sm font-semibold py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                      {interior === r.id ? 'Salir de la vista interior' : 'Ver por dentro'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-primary rounded-xl p-4 text-white text-center">
          <p className="text-sm text-white/90 mb-3">Presupuesto <strong>gratuito</strong> tras visita técnica. Sin compromiso.</p>
          <button onClick={solicitar} disabled={!rooms.length} className="w-full bg-white text-primary font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">Solicitar presupuesto</button>
        </div>
      </aside>

      <div className="relative flex-1 min-h-[400px]">
        <Scene rooms={rooms} vivienda={setup.vivienda} selectedId={selectedId} onSelect={setSelectedId} interior={interior} onEnter={setInterior} totalSize={totalSize} />
        <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow-sm pointer-events-none">
          {interior ? 'Vista interior · arrastra para mirar' : 'Arrastra para girar · doble clic en una estancia para entrar'}
        </div>
        {interior && (
          <button onClick={() => setInterior(null)} className="absolute top-3 right-3 bg-white text-primary text-sm font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-gray-50">← Salir</button>
        )}
      </div>
    </div>
  );
}
