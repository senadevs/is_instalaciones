import { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html, ContactShadows, Sky, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { Model, MODELS, getFurniture } from './models.jsx';
import { ROOM_TYPES, VIVIENDAS, WALL_DEFAULT, FURNITURE_BY_KEY, FLOOR_H } from './catalog.js';
import { placeRooms, computeWalls, getOpening, pickEntrance, fittedAuto } from './geometry.js';
import { resolveFurnitureRenderPose } from './renderPlacement.js';

// Helpers para leer el nuevo modelo de servicios.
const svcOn = (r, s) => !!r.services?.[s]?.on;
const opt = (r, s, o) => svcOn(r, s) && !!r.services[s][o];

// ---- Tiras LED perimetrales (techo) ----------------------------------------
function LedStrips({ w, l, h, color }) {
  const y = h - 0.05;
  const inset = 0.28;
  const ww = Math.max(0.4, w - inset * 2);
  const ll = Math.max(0.4, l - inset * 2);
  const Strip = ({ position, args }) => (
    <mesh position={position}><boxGeometry args={args} />
      <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={2.4} toneMapped={false} />
    </mesh>
  );
  return (
    <group>
      <Strip position={[0, y, -ll / 2]} args={[ww, 0.04, 0.05]} />
      <Strip position={[0, y, ll / 2]} args={[ww, 0.04, 0.05]} />
      <Strip position={[-ww / 2, y, 0]} args={[0.05, 0.04, ll]} />
      <Strip position={[ww / 2, y, 0]} args={[0.05, 0.04, ll]} />
      <pointLight position={[0, y - 0.25, 0]} color={color} intensity={5} distance={Math.max(w, l) * 1.9} decay={2} />
    </group>
  );
}

// ---- Estructura vertical: escalera / rampa / ascensor ----------------------
function VerticalStruct({ type, w, l }) {
  if (type === 'rampa') {
    const len = Math.hypot(l, FLOOR_H);
    const ang = Math.atan2(FLOOR_H, l);
    return (
      <mesh rotation={[-ang, 0, 0]} position={[0, FLOOR_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[Math.min(w, 1.4), 0.12, len]} /><meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
    );
  }
  if (type === 'ascensor') {
    const cw = Math.min(w, 1.5) - 0.1, cl = Math.min(l, 1.5) - 0.1;
    return (
      <group>
        <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[cw, 2.2, cl]} /><meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[0, 1.1, cl / 2]}><boxGeometry args={[cw * 0.7, 2, 0.04]} /><meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} /></mesh>
      </group>
    );
  }
  // escalera: peldaños que suben hasta la planta superior
  const steps = 12;
  const sh = FLOOR_H / steps, sd = (l - 0.3) / steps, sw = Math.min(w, 1.2);
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => (
        <mesh key={i} position={[0, sh * (i + 0.5), -l / 2 + 0.15 + sd * (i + 0.5)]} castShadow receiveShadow>
          <boxGeometry args={[sw, sh, sd]} /><meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ---- Equipos de instalaciones (representación 3D de servicios) -------------
function ServiceProps({ room, w, l, h }) {
  const s = room.services || {};
  const clima = s.climatizacion || {};
  const elec = s.electricidad || {};
  const font = s.fontaneria || {};
  return (
    <group>
      {clima.on && clima.aire && (
        <group position={[0, h - 0.45, -l / 2 + 0.13]}>
          <mesh castShadow><boxGeometry args={[0.9, 0.28, 0.22]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
          <mesh position={[0, -0.16, 0.02]}><boxGeometry args={[0.8, 0.04, 0.2]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
        </group>
      )}
      {clima.on && clima.aerotermia && (
        <group position={[w / 2 - 0.55, 0, l / 2 - 0.45]}>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.95, 0.75, 0.35]} /><meshStandardMaterial color="#e2e8f0" roughness={0.5} metalness={0.3} /></mesh>
          <mesh position={[0, 0.4, 0.19]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.24, 0.24, 0.05, 24]} /><meshStandardMaterial color="#475569" /></mesh>
        </group>
      )}
      {clima.on && clima.radiadores && (
        <mesh position={[-w / 2 + 0.16, 0.45, l / 2 - 1]} castShadow><boxGeometry args={[0.1, 0.5, 0.9]} /><meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.4} /></mesh>
      )}
      {font.on && font.termo && (
        <mesh position={[w / 2 - 0.35, 1.5, -l / 2 + 0.35]} castShadow><cylinderGeometry args={[0.27, 0.27, 0.7, 20]} /><meshStandardMaterial color="#f1f5f9" metalness={0.3} roughness={0.4} /></mesh>
      )}
      {elec.on && elec.cuadro && (
        <mesh position={[-w / 2 + 0.07, 1.5, -l / 2 + 0.6]} castShadow><boxGeometry args={[0.06, 0.4, 0.3]} /><meshStandardMaterial color="#d4d4d8" roughness={0.6} /></mesh>
      )}
    </group>
  );
}

// ---- Navegación en primera persona (WASD + ratón con pointer-lock) ---------
function FirstPerson({ start }) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const vel = useRef(new THREE.Vector3());
  const eye = (start.y || 0) + 1.6;
  useEffect(() => {
    camera.position.set(start.x, eye, start.z + 0.01);
    const dn = (e) => { keys.current[e.code] = true; };
    const up = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, [camera, start.x, start.z, eye]);

  useFrame((_, dt) => {
    const k = keys.current;
    const speed = (k.ShiftLeft ? 4.5 : 2.6) * Math.min(dt, 0.05);
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const dir = new THREE.Vector3();
    if (k.KeyW || k.ArrowUp) dir.add(fwd);
    if (k.KeyS || k.ArrowDown) dir.sub(fwd);
    if (k.KeyD || k.ArrowRight) dir.add(right);
    if (k.KeyA || k.ArrowLeft) dir.sub(right);
    vel.current.lerp(dir.lengthSq() > 0 ? dir.normalize().multiplyScalar(speed) : new THREE.Vector3(), 0.3);
    camera.position.add(vel.current);
    camera.position.y = eye;
  });

  // ESC libera el ratón pero NO sale del interior (se sale con el botón).
  return <PointerLockControls camera={camera} domElement={gl.domElement} />;
}

// ---- Muro con apertura (puerta/ventana/hueco) ------------------------------
function Wall({ len, h, opening = null, color = WALL_DEFAULT, thick = 0.1 }) {
  const wallMat = <meshStandardMaterial color={color} roughness={0.9} />;
  if (!opening) {
    return <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[len, h, thick]} />{wallMat}</mesh>;
  }
  const isWindow = opening.role === 'window';
  const openW = isWindow ? Math.min(1.6, len * 0.6) : Math.min(opening.width || 0.9, len - 0.2);
  const openBottom = isWindow ? (opening.bottom ?? 0.95) : 0;
  const openTop = isWindow ? Math.min(h - 0.05, opening.top ?? 2.05) : Math.min(h - 0.1, opening.kind === 'hueco' ? 2.25 : 2.1);
  // Offset del hueco a lo largo de la pared (eje X local); centrado si no hay.
  const maxOff = (len - openW) / 2 - 0.02;
  const off = Math.max(-maxOff, Math.min(maxOff, isWindow ? 0 : (opening.offset || 0)));
  const leftW = (len / 2 + off) - openW / 2;   // tramo de pared a la izquierda
  const rightW = (len / 2 - off) - openW / 2;  // tramo de pared a la derecha

  return (
    <group>
      {leftW > 0.01 && <mesh position={[-len / 2 + leftW / 2, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[leftW, h, thick]} />{wallMat}</mesh>}
      {rightW > 0.01 && <mesh position={[len / 2 - rightW / 2, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[rightW, h, thick]} />{wallMat}</mesh>}
      {openBottom > 0 && <mesh position={[off, openBottom / 2, 0]} castShadow receiveShadow><boxGeometry args={[openW, openBottom, thick]} />{wallMat}</mesh>}
      {openTop < h && <mesh position={[off, (openTop + h) / 2, 0]} castShadow receiveShadow><boxGeometry args={[openW, h - openTop, thick]} />{wallMat}</mesh>}

      {/* Cristal (ventana o puerta acristalada) */}
      {(isWindow || opening.hoja === 'cristal') && (
        <mesh position={[off, (openBottom + openTop) / 2, 0]}>
          <boxGeometry args={[openW - 0.04, openTop - openBottom, 0.04]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.4} roughness={0.05} metalness={0.4} emissive="#7dd3fc" emissiveIntensity={0.12} />
        </mesh>
      )}
      {/* Montante central de ventana corredera */}
      {opening.slide && (
        <mesh position={[off, (openBottom + openTop) / 2, 0]}><boxGeometry args={[0.05, openTop - openBottom, 0.06]} /><meshStandardMaterial color="#e2e8f0" roughness={0.5} /></mesh>
      )}
      {/* Hoja de puerta (panel) */}
      {opening.hoja === 'panel' && (
        <mesh position={[off - openW / 2 + (openW * 0.96) / 2, openTop / 2, 0.02]} rotation={[0, opening.kind === 'corredera' ? 0 : -0.5, 0]} castShadow>
          <boxGeometry args={[openW * 0.96, openTop - 0.04, 0.04]} />
          <meshStandardMaterial color="#d6c3a5" roughness={0.6} />
        </mesh>
      )}
      {/* Marco superior para huecos/arcos */}
      {(opening.role === 'open' || opening.kind === 'arco') && openTop < h && (
        <mesh position={[off, openTop + 0.03, 0]}><boxGeometry args={[openW + 0.06, 0.08, thick + 0.04]} /><meshStandardMaterial color="#e7e1d6" roughness={0.7} /></mesh>
      )}
    </group>
  );
}

function Room({ room, wall, entrance, selected, onSelect, onEnter }) {
  const { width: w, length: l, height: h, type } = room;
  const t = ROOM_TYPES[type];
  const shape = t.shape;
  const rev = room.services?.revestimientos || {};
  const parquet = rev.on && rev.tarima;
  const tiled = rev.on && rev.alicatado;
  const premium = room.finish === 'premium' || room.finish === 'lujo';
  const wallColor = opt(room, 'revestimientos', 'pintura') ? room.paint : (tiled ? '#dde7ec' : WALL_DEFAULT);
  const floorColor = selected ? '#dbeafe' : parquet ? '#b07d4f' : tiled ? '#e6edf1' : t.color;
  const floorRough = tiled ? 0.2 : parquet ? 0.45 : premium ? 0.25 : room.finish === 'medio' ? 0.6 : 0.95;
  const floorMetal = tiled ? 0.18 : parquet ? 0.05 : premium ? 0.2 : 0.05;
  const windows = opt(room, 'carpinteria', 'ventanas');
  const ledOn = opt(room, 'electricidad', 'led');
  const vertical = !!t.vertical;

  const op = (side) => getOpening(room, side, wall[side], {
    windows,
    entrance: entrance && entrance.side === side,
  });

  const furniture = room.furniture?.length
    ? room.furniture
    : (svcOn(room, 'mobiliario') ? fittedAuto(type, w, l).map((f, i) => ({ ...f, id: 'a' + i })) : []);

  return (
    <group position={[room.cx, (room.level || 0) * FLOOR_H, room.cz]}
      onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEnter(room.id); }}>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color={floorColor} roughness={floorRough} metalness={floorMetal} />
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

          {ledOn && <LedStrips w={w} l={l} h={h} color={room.led} />}
          {vertical && <VerticalStruct type={type} w={w} l={l} />}
          {!vertical && <ServiceProps room={room} w={w} l={l} h={h} />}

          {furniture.length > 0 && (
            <Suspense fallback={null}>
              {furniture.map((f, i) => {
                const cat = FURNITURE_BY_KEY[f.key];
                const url = cat ? MODELS[cat.model] : (f.url || MODELS[f.model]);
                if (!url) return null;
                const pose = resolveFurnitureRenderPose(f, furniture);
                return <Model key={f.id || i} url={url} position={[pose.x, pose.y, pose.z]} rotation={[0, f.rot || 0, 0]} scale={f.scale || 1} />;
              })}
            </Suspense>
          )}
        </>
      )}

      {shape === 'terraza' && (
        <>
          {['n', 's'].map((s, i) => <group key={s} position={[0, 0, (i ? 1 : -1) * l / 2]}><Wall len={w} h={1} color="#cbd5e1" thick={0.06} /></group>)}
          {['w', 'e'].map((s, i) => <group key={s} position={[(i ? 1 : -1) * w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Wall len={l} h={1} color="#cbd5e1" thick={0.06} /></group>)}
          {svcOn(room, 'mobiliario') && (
            <Suspense fallback={null}>
              {getFurniture('terraza', w, l).map((f, i) => (<Model key={i} url={f.url} position={f.position} rotation={f.rotation || [0, 0, 0]} scale={f.scale || 1} />))}
            </Suspense>
          )}
        </>
      )}

      <Html position={[0, (shape === 'room' ? h : 1) + 0.3, 0]} center distanceFactor={16} zIndexRange={[20, 0]}>
        <div style={{ background: selected ? '#4f46e5' : 'rgba(255,255,255,.94)', color: selected ? '#fff' : '#1f2937', padding: '3px 9px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,.18)', pointerEvents: 'none' }}>
          {t.label} · {(w * l).toFixed(1)} m²
        </div>
      </Html>
    </group>
  );
}

export default function Scene3D({ rooms, vivienda, selectedId, onSelect, interior, onEnter, totalSize }) {
  const placed = useMemo(() => placeRooms(rooms), [rooms]);
  const walls = useMemo(() => computeWalls(placed), [placed]);
  const entrance = useMemo(() => pickEntrance(placed, walls), [placed, walls]);

  const dist = Math.max(10, totalSize * 1.15);
  const isCasa = VIVIENDAS[vivienda]?.garden;
  const interiorRoom = interior ? placed.find((r) => r.id === interior) : null;
  return (
    <Canvas shadows camera={{ position: [dist, dist * 0.85, dist], fov: 45 }} onPointerMissed={() => onSelect(null)}>
      <Sky sunPosition={[20, 30, 10]} turbidity={6} rayleigh={1} />
      <hemisphereLight args={['#ffffff', isCasa ? '#9ccc65' : '#cbd5e1', 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[18, 26, 12]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color={isCasa ? '#86b94e' : '#e7e5e4'} roughness={1} />
      </mesh>
      <ContactShadows position={[0, 0.03, 0]} scale={Math.max(20, totalSize * 2.4)} blur={2.2} opacity={0.35} far={12} />
      <Grid infiniteGrid cellSize={1} sectionSize={5} cellColor={isCasa ? '#9ccc65' : '#cbd5e1'} sectionColor={isCasa ? '#7cb342' : '#94a3b8'} fadeDistance={70} fadeStrength={1.5} />

      {placed.map((r, i) => (
        <Room key={r.id} room={r} wall={walls[i]}
          entrance={entrance && entrance.roomId === r.id ? entrance : null}
          selected={r.id === selectedId} onSelect={onSelect} onEnter={onEnter} />
      ))}

      {interiorRoom ? (
        <FirstPerson start={{ x: interiorRoom.cx, z: interiorRoom.cz, y: (interiorRoom.level || 0) * FLOOR_H }} />
      ) : (
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2} maxDistance={140} maxPolarAngle={Math.PI / 2.04} />
      )}
    </Canvas>
  );
}
