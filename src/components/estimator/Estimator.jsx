import { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';

// ---- Catálogos ----
const TYPES = {
  salon: { label: 'Salón', color: '#10b981', def: [5, 4], shape: 'room' },
  cocina: { label: 'Cocina', color: '#f97316', def: [3, 3], shape: 'room' },
  bano: { label: 'Baño', color: '#3b82f6', def: [2, 2], shape: 'room' },
  dormitorio: { label: 'Dormitorio', color: '#8b5cf6', def: [4, 3], shape: 'room' },
  comedor: { label: 'Comedor', color: '#14b8a6', def: [4, 4], shape: 'room' },
  pasillo: { label: 'Pasillo', color: '#eab308', def: [3, 1.5], shape: 'room' },
  garaje: { label: 'Garaje', color: '#6b7280', def: [5, 3], shape: 'room' },
  terraza: { label: 'Terraza', color: '#84cc16', def: [4, 3], shape: 'terraza' },
  piscina: { label: 'Piscina', color: '#06b6d4', def: [6, 3], shape: 'piscina' },
  jacuzzi: { label: 'Jacuzzi', color: '#22d3ee', def: [2.5, 2.5], shape: 'jacuzzi' },
};
const FINISHES = { estandar: 'Estándar', medio: 'Medio', premium: 'Premium' };
const REFORMS = { integral: 'Integral', parcial: 'Parcial' };
const FINISH_MAT = {
  estandar: { roughness: 0.95, metalness: 0.0 },
  medio: { roughness: 0.6, metalness: 0.05 },
  premium: { roughness: 0.25, metalness: 0.2 },
};
const WORKS = [
  { key: 'led', label: 'Iluminación LED' },
  { key: 'electricidad', label: 'Electricidad' },
  { key: 'fontaneria', label: 'Fontanería' },
  { key: 'climatizacion', label: 'Climatización' },
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

let uid = 1;
function newRoom(type) {
  const d = TYPES[type].def;
  return { id: uid++, type, width: d[0], length: d[1], height: 2.6, reform: 'integral', finish: 'medio', works: { led: true, pintura: true } };
}

// ---- Auto-disposición en planta ----
function layout(rooms) {
  const maxRow = 13, gap = 0.3;
  let x = 0, z = 0, rowDepth = 0;
  const placed = rooms.map((r) => {
    if (x + r.width > maxRow && x > 0) { x = 0; z += rowDepth + gap; rowDepth = 0; }
    const p = { ...r, px: x, pz: z };
    x += r.width + gap; rowDepth = Math.max(rowDepth, r.length);
    return p;
  });
  if (placed.length) {
    const maxX = Math.max(...placed.map((r) => r.px + r.width));
    const maxZ = Math.max(...placed.map((r) => r.pz + r.length));
    placed.forEach((r) => { r.cx = r.px + r.width / 2 - maxX / 2; r.cz = r.pz + r.length / 2 - maxZ / 2; });
  }
  return placed;
}

// ---- Piezas 3D ----
function Wall({ w, h, d, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#eceae6" roughness={0.9} />
    </mesh>
  );
}

function Room({ room, selected, onSelect }) {
  const { width: w, length: l, height: h, type, finish, works = {} } = room;
  const t = 0.1;
  const mat = FINISH_MAT[finish] || FINISH_MAT.estandar;
  const color = TYPES[type].color;
  const shape = TYPES[type].shape;

  return (
    <group position={[room.cx, 0, room.cz]} onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color={selected ? '#dbeafe' : color} roughness={mat.roughness} metalness={mat.metalness} />
      </mesh>

      {shape === 'piscina' && (
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[w * 0.8, 0.7, l * 0.8]} />
          <meshStandardMaterial color="#0891b2" roughness={0.1} metalness={0.3} transparent opacity={0.85} />
        </mesh>
      )}
      {shape === 'jacuzzi' && (
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[Math.min(w, l) / 2.4, Math.min(w, l) / 2.2, 0.6, 24]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.15} metalness={0.3} />
        </mesh>
      )}

      {shape === 'room' && (
        <>
          <Wall w={w} h={h} d={t} position={[0, h / 2, -l / 2]} />
          <Wall w={w} h={h} d={t} position={[0, h / 2, l / 2]} />
          <Wall w={t} h={h} d={l} position={[-w / 2, h / 2, 0]} />
          <Wall w={t} h={h} d={l} position={[w / 2, h / 2, 0]} />
          {/* Puerta (en pared frontal) */}
          {works.puertas && (
            <mesh position={[Math.min(0.6, w / 4), 1.02, l / 2 - 0.02]}>
              <boxGeometry args={[0.9, 2.04, 0.06]} />
              <meshStandardMaterial color="#8b5e34" roughness={0.6} />
            </mesh>
          )}
          {/* Ventana (en pared trasera) */}
          {works.ventanas && (
            <mesh position={[0, h * 0.58, -l / 2 + 0.06]}>
              <boxGeometry args={[Math.min(1.4, w * 0.5), 1.0, 0.04]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.05} metalness={0.4} transparent opacity={0.6} emissive="#7dd3fc" emissiveIntensity={0.2} />
            </mesh>
          )}
          {/* LED en el techo */}
          {works.led && (
            <mesh position={[0, h - 0.08, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#fff7cc" emissiveIntensity={1.4} />
            </mesh>
          )}
        </>
      )}

      {shape === 'terraza' && (
        // Barandilla perimetral
        <>
          <Wall w={w} h={1} d={0.06} position={[0, 0.5, -l / 2]} />
          <Wall w={w} h={1} d={0.06} position={[0, 0.5, l / 2]} />
          <Wall w={0.06} h={1} d={l} position={[-w / 2, 0.5, 0]} />
          <Wall w={0.06} h={1} d={l} position={[w / 2, 0.5, 0]} />
        </>
      )}

      {/* Etiqueta */}
      <Html position={[0, (shape === 'room' ? h : 1) + 0.3, 0]} center distanceFactor={14} occlude={false} zIndexRange={[20, 0]}>
        <div style={{
          background: selected ? '#1d4ed8' : 'rgba(255,255,255,.94)',
          color: selected ? '#fff' : '#1f2937',
          padding: '3px 9px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
          whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,.18)', pointerEvents: 'none',
        }}>
          {TYPES[type].label} · {(w * l).toFixed(1)} m²
        </div>
      </Html>
    </group>
  );
}

// Anima la cámara: vista general (orbit) o inmersiva dentro de una estancia
function CameraRig({ interior }) {
  const { camera, controls } = useThree();
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  useFrame(() => {
    if (!interior) return;
    tPos.current.set(interior.cx - interior.width / 4, 1.6, interior.cz + interior.length / 4);
    tLook.current.set(interior.cx, 1.2, interior.cz);
    camera.position.lerp(tPos.current, 0.07);
    if (controls) { controls.target.lerp(tLook.current, 0.07); controls.update(); }
  });
  return null;
}

function Scene({ rooms, selectedId, onSelect, interior, totalSize }) {
  const placed = useMemo(() => layout(rooms), [rooms]);
  const dist = Math.max(10, totalSize * 1.1);
  return (
    <Canvas shadows camera={{ position: [dist, dist * 0.9, dist], fov: 45 }} onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#eef2f6']} />
      <hemisphereLight args={['#ffffff', '#cbd5e1', 0.9]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[14, 20, 10]} intensity={2.4} castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30} shadow-camera-right={30}
        shadow-camera-top={30} shadow-camera-bottom={-30}
      />
      {/* Suelo receptor de sombras */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.22} />
      </mesh>
      <Grid infiniteGrid cellSize={1} sectionSize={5} cellColor="#cbd5e1" sectionColor="#94a3b8" fadeDistance={60} fadeStrength={1.5} />

      {placed.map((r) => (
        <Room key={r.id} room={r} selected={r.id === selectedId} onSelect={onSelect} />
      ))}

      <CameraRig interior={interior ? placed.find((r) => r.id === interior) : null} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2} maxDistance={120} maxPolarAngle={Math.PI / 2.02} />
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
  const totalSize = Math.max(8, Math.sqrt(totalM2) * 2.5);
  const sel = rooms.find((r) => r.id === selectedId);

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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7rem)] min-h-[560px] bg-gray-100">
      {/* Panel lateral */}
      <aside className="w-full lg:w-[360px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">
        {/* Config previa */}
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
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXTRAS.map((e) => (
              <button key={e.key} onClick={() => setExtras({ ...extras, [e.key]: !extras[e.key] })}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${extras[e.key] ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Añadir estancia */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">2. Añadir estancia</h3>
          <div className="flex gap-2">
            <select className={input} value={addType} onChange={(e) => setAddType(e.target.value)}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={addRoom} className="bg-primary text-white font-semibold px-4 rounded-lg hover:bg-secondary transition-colors shrink-0">+</button>
          </div>
        </div>

        {/* Lista / edición */}
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
                          <button key={w.key} onClick={() => toggleWork(r.id, w.key)}
                            className={`text-xs px-2 py-1 rounded-full border transition ${r.works?.[w.key] ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setInterior(interior === r.id ? null : r.id)}
                      className="w-full text-sm font-semibold py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                      {interior === r.id ? 'Salir de la vista interior' : '👁 Ver por dentro'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-primary rounded-xl p-4 text-white text-center">
          <p className="text-sm text-white/90 mb-3">Presupuesto <strong>gratuito</strong> tras visita técnica. Sin compromiso.</p>
          <button onClick={solicitar} disabled={!rooms.length} className="w-full bg-white text-primary font-bold py-2.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
            Solicitar presupuesto
          </button>
        </div>
      </aside>

      {/* Canvas 3D — ocupa el resto */}
      <div className="relative flex-1 min-h-[400px]">
        <Scene rooms={rooms} selectedId={selectedId} onSelect={setSelectedId} interior={interior} totalSize={totalSize} />
        <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow-sm pointer-events-none">
          {interior ? 'Vista interior · arrastra para mirar' : 'Arrastra para girar · rueda para zoom · clic en una estancia para verla'}
        </div>
        {interior && (
          <button onClick={() => setInterior(null)} className="absolute top-3 right-3 bg-white text-primary text-sm font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-gray-50">
            ← Salir
          </button>
        )}
      </div>
    </div>
  );
}
