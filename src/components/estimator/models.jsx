import { useGLTF, Clone } from '@react-three/drei';

// Modelos GLTF (Kenney Furniture Kit, CC0) servidos desde /public/models
export const MODELS = {
  sofa: '/models/loungeSofa.glb',
  sofaLong: '/models/loungeSofaLong.glb',
  armchair: '/models/loungeChair.glb',
  coffeeTable: '/models/tableCoffee.glb',
  tv: '/models/televisionModern.glb',
  tvCabinet: '/models/cabinetTelevision.glb',
  bed: '/models/bedDouble.glb',
  nightstand: '/models/sideTableDrawers.glb',
  wardrobe: '/models/bookcaseClosedDoors.glb',
  kitchenCabinet: '/models/kitchenCabinet.glb',
  kitchenUpper: '/models/kitchenCabinetUpper.glb',
  kitchenFridge: '/models/kitchenFridge.glb',
  kitchenSink: '/models/kitchenSink.glb',
  kitchenStove: '/models/kitchenStove.glb',
  toilet: '/models/toilet.glb',
  bathSink: '/models/bathroomSink.glb',
  bathtub: '/models/bathtub.glb',
  shower: '/models/shower.glb',
  table: '/models/table.glb',
  chair: '/models/chair.glb',
  desk: '/models/desk.glb',
  deskChair: '/models/chairDesk.glb',
  ceilingLamp: '/models/lampSquareCeiling.glb',
  plant: '/models/pottedPlant.glb',
  plantSmall: '/models/plantSmall1.glb',
  rug: '/models/rugRectangle.glb',
  doorFront: '/models/doorwayFront.glb',
  doorway: '/models/doorway.glb',
};

Object.values(MODELS).forEach((u) => useGLTF.preload(u));

// Escala global: los modelos Kenney están en metros aprox.
const S = 1;

export function Model({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF(url);
  return <Clone object={scene} position={position} rotation={rotation} scale={scale * S} castShadow receiveShadow />;
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
