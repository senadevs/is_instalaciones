import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, Clone } from '@react-three/drei';
import { getModelAnchorOffset } from './renderPlacement.js';

// Modelos GLTF (Kenney Furniture Kit, CC0) servidos desde /public/models.
// Kit completo de ~140 piezas; las claves son alias usados por el catálogo.
const m = (file) => `/models/${file}.glb`;
export const MODELS = {
  // Salón
  sofa: m('loungeSofa'), sofaLong: m('loungeSofaLong'), sofaCorner: m('loungeSofaCorner'),
  sofaOttoman: m('loungeSofaOttoman'), designSofa: m('loungeDesignSofa'), designSofaCorner: m('loungeDesignSofaCorner'),
  armchair: m('loungeChair'), armchairRelax: m('loungeChairRelax'), designChair: m('loungeDesignChair'),
  coffeeTable: m('tableCoffee'), coffeeTableGlass: m('tableCoffeeGlass'), coffeeTableSquare: m('tableCoffeeSquare'),
  tv: m('televisionModern'), tvVintage: m('televisionVintage'), tvCabinet: m('cabinetTelevision'), tvCabinetDoors: m('cabinetTelevisionDoors'),
  bookcase: m('bookcaseOpen'), bookcaseClosed: m('bookcaseClosedDoors'), bookcaseWide: m('bookcaseClosedWide'),
  books: m('books'), radio: m('radio'), speaker: m('speaker'), pillow: m('pillow'),
  // Comedor / mesas
  table: m('table'), tableRound: m('tableRound'), tableGlass: m('tableGlass'), tableCloth: m('tableCloth'),
  chair: m('chair'), chairCushion: m('chairCushion'), chairModern: m('chairModernCushion'), chairRounded: m('chairRounded'),
  stoolBar: m('stoolBar'), stoolBarSquare: m('stoolBarSquare'), bench: m('bench'), benchCushion: m('benchCushion'),
  // Dormitorio
  bed: m('bedDouble'), bedSingle: m('bedSingle'), bedBunk: m('bedBunk'), cabinetBed: m('cabinetBed'), cabinetBedDrawer: m('cabinetBedDrawerTable'),
  nightstand: m('sideTableDrawers'), sideTable: m('sideTable'), wardrobe: m('bookcaseClosedDoors'), coatRack: m('coatRackStanding'),
  // Cocina
  kitchenCabinet: m('kitchenCabinet'), kitchenCabinetDrawer: m('kitchenCabinetDrawer'), kitchenBar: m('kitchenBar'),
  kitchenUpper: m('kitchenCabinetUpper'), kitchenUpperDouble: m('kitchenCabinetUpperDouble'),
  kitchenFridge: m('kitchenFridge'), kitchenFridgeLarge: m('kitchenFridgeLarge'), kitchenFridgeBuiltIn: m('kitchenFridgeBuiltIn'),
  kitchenSink: m('kitchenSink'), kitchenStove: m('kitchenStove'), kitchenStoveElectric: m('kitchenStoveElectric'),
  microwave: m('kitchenMicrowave'), coffeeMachine: m('kitchenCoffeeMachine'), blender: m('kitchenBlender'),
  toaster: m('toaster'), hood: m('hoodModern'), hoodLarge: m('hoodLarge'), washer: m('washer'), dryer: m('dryer'),
  // Baño
  toilet: m('toilet'), toiletSquare: m('toiletSquare'), bathSink: m('bathroomSink'), bathSinkSquare: m('bathroomSinkSquare'),
  bathtub: m('bathtub'), shower: m('shower'), showerRound: m('showerRound'), bathCabinet: m('bathroomCabinet'), bathMirror: m('bathroomMirror'),
  // Oficina
  desk: m('desk'), deskCorner: m('deskCorner'), deskChair: m('chairDesk'),
  computer: m('computerScreen'), keyboard: m('computerKeyboard'), laptop: m('laptop'),
  // Iluminación
  ceilingLamp: m('lampSquareCeiling'), ceilingFan: m('ceilingFan'),
  floorLamp: m('lampRoundFloor'), floorLampSquare: m('lampSquareFloor'),
  tableLamp: m('lampRoundTable'), wallLamp: m('lampWall'),
  // Deco / plantas / alfombras
  plant: m('pottedPlant'), plantSmall: m('plantSmall1'), plantSmall2: m('plantSmall2'), plantSmall3: m('plantSmall3'),
  rug: m('rugRectangle'), rugRound: m('rugRound'), rugSquare: m('rugSquare'), doormat: m('rugDoormat'),
  trashcan: m('trashcan'), boxOpen: m('cardboardBoxOpen'), bear: m('bear'),
  // Puertas / arquitectura
  doorFront: m('doorwayFront'), doorway: m('doorway'), doorwayOpen: m('doorwayOpen'),
  stairs: m('stairs'), stairsOpen: m('stairsOpen'),
};

// Sin preload masivo: cada modelo se carga bajo demanda (useGLTF cachea) y
// aparece de forma progresiva dentro de <Suspense>. Evita un pico de descargas
// al abrir el estimador.

// Escala global: los modelos Kenney están en metros aprox.
const S = 1;

export function Model({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF(url);
  const anchor = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return getModelAnchorOffset({ min: box.min.toArray(), max: box.max.toArray() });
  }, [scene]);

  return (
    <group position={position} rotation={rotation} scale={scale * S}>
      <Clone object={scene} position={[anchor.x, anchor.y, anchor.z]} castShadow receiveShadow />
    </group>
  );
}

// Devuelve el mobiliario (lista de piezas en coords locales de la estancia,
// centro en el origen, suelo en y=0) según el tipo y las medidas.
export function getFurniture(type, w, l) {
  const back = -l / 2 + 0.6;   // pegado a pared trasera (-z)
  const front = l / 2 - 0.6;   // pegado a pared frontal (+z)
  const left = -w / 2 + 0.5;   // pared izquierda (-x)
  const right = w / 2 - 0.5;   // pared derecha (+x)
  const P = Math.PI;

  switch (type) {
    case 'salon':
      return [
        { url: MODELS.rug, position: [0, 0.01, 0], scale: 1.2 },
        { url: MODELS.sofa, position: [0, 0, back], rotation: [0, 0, 0], scale: 1 },
        { url: MODELS.coffeeTable, position: [0, 0, back + 1.1], scale: 1 },
        { url: MODELS.tvCabinet, position: [0, 0, front], rotation: [0, P, 0], scale: 1 },
        { url: MODELS.tv, position: [0, 0.55, front - 0.05], rotation: [0, P, 0], scale: 1 },
        { url: MODELS.plant, position: [left, 0, front], scale: 1 },
      ];
    case 'comedor':
      return [
        { url: MODELS.table, position: [0, 0, 0], scale: 1 },
        { url: MODELS.chair, position: [0, 0, -0.9], rotation: [0, 0, 0], scale: 1 },
        { url: MODELS.chair, position: [0, 0, 0.9], rotation: [0, P, 0], scale: 1 },
        { url: MODELS.chair, position: [-0.9, 0, 0], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.chair, position: [0.9, 0, 0], rotation: [0, -P / 2, 0], scale: 1 },
      ];
    case 'cocina':
      return [
        { url: MODELS.kitchenFridge, position: [left, 0, back], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.kitchenStove, position: [left, 0, back + 1], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.kitchenCabinet, position: [left, 0, back + 1.9], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.kitchenSink, position: [left, 0, back + 2.8], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.kitchenUpper, position: [left, 1.4, back + 1], rotation: [0, P / 2, 0], scale: 1 },
      ];
    case 'bano':
      return [
        { url: MODELS.toilet, position: [left, 0, back], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.bathSink, position: [right, 0, back], rotation: [0, -P / 2, 0], scale: 1 },
        { url: MODELS.bathtub, position: [0, 0, front], rotation: [0, P, 0], scale: 1 },
      ];
    case 'dormitorio':
      return [
        { url: MODELS.bed, position: [0, 0, back + 0.5], rotation: [0, 0, 0], scale: 1 },
        { url: MODELS.nightstand, position: [left, 0, back], scale: 1 },
        { url: MODELS.nightstand, position: [right, 0, back], scale: 1 },
        { url: MODELS.wardrobe, position: [right, 0, front], rotation: [0, P, 0], scale: 1 },
        { url: MODELS.rug, position: [0, 0.01, front - 0.5], scale: 1 },
      ];
    case 'oficina':
    case 'local':
      return [
        { url: MODELS.desk, position: [0, 0, back], scale: 1 },
        { url: MODELS.deskChair, position: [0, 0, back + 0.8], rotation: [0, P, 0], scale: 1 },
        { url: MODELS.plant, position: [left, 0, front], scale: 1 },
      ];
    case 'terraza':
      return [
        { url: MODELS.table, position: [0, 0, 0], scale: 1 },
        { url: MODELS.chair, position: [-0.9, 0, 0], rotation: [0, P / 2, 0], scale: 1 },
        { url: MODELS.chair, position: [0.9, 0, 0], rotation: [0, -P / 2, 0], scale: 1 },
        { url: MODELS.plantSmall, position: [right, 0, back], scale: 1 },
      ];
    default:
      return [];
  }
}
