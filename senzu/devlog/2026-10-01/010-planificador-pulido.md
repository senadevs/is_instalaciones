# 010 — Planificador: auditoría y pulido sin cambiar la estructura (F5-T1 + arreglos 1-7)

- **Fecha/hora:** 2026-10-01 14:05
- **Tipo:** fix
- **Mejora a:** —
- **Tarea:** F5-T1 (y parte de F5-T2/F5-T3)
- **Stack:** astro

## Auditoría (capturas a 1440/375, temas default y dark)
1. Acentos de interfaz en índigo (selector Planta/3D, borde de estancia seleccionada, etiqueta 3D): fuera de marca.
2. Nombres de estancia de una línea a 0.35 m de letra: más anchos que la estancia ("Recibidor · 5.0 m²" invadía el pasillo).
3. Cotas del modelo de exportación a 0.45 m por FUERA de cada estancia: en pisos con estancias pegadas caían dentro de la vecina; además no seguían el arrastre.
4. Bordes de estancias, muebles y cotas con `vectorEffect="non-scaling-stroke"` y grosores 0.02-0.08 → **en píxeles de pantalla**, es decir, invisibles.
5. Botones de exportar con un cuadrado que parecía una casilla: `file-text`, `ruler`, `scan`, `image`, `folder-down` (y `triangle-alert`) no estaban registrados en `ui.jsx` y caían al `Square` por defecto.
6. `<button>` dentro de `<button>` en la cabecera de cada estancia (papelera dentro del toggle): error de hidratación en consola y a11y rota.
7. Sección SEO: h1 de 5 líneas y aside "Qué resuelve" estirado con hueco.
8. (Pendiente de decidir con el cliente) En móvil el plano no se ve sin bajar mucho.

## Qué se hizo (1-7)
- `PlanEditor.jsx`: `BRAND = '#046a53'` para selección (borde 3 px); `RoomLabel` (nombre + m² en dos líneas, tamaño ajustado al ancho) y `RoomDims` (cotas por dentro, ancho arriba y largo a la derecha, con marcas) pintados en una pasada final sobre muebles y vecinas, y siguiendo la posición de arrastre; grosores a 1/2/3 px reales; hover del menú de mueble en verde. Se deja de pintar `activeSheet.dimensions` en el editor (la exportación PDF/DXF/SVG no cambia).
- `Estimator.jsx`: selector Planta/3D activo `bg-emerald-700` (el `--color-primary` del tema `dark` es casi negro y no se vería sobre la barra oscura).
- `Scene3D.jsx`: etiqueta seleccionada `#046a53`.
- `Panel.jsx`: cabecera del `Node` con el toggle y las acciones como hermanos (`aria-expanded`), papelera `gray-400` con `aria-label="Eliminar <estancia>"`, badge `gray-500`.
- `ui.jsx`: registrados `FileText`, `Ruler`, `Scan`, `Image`, `FolderDown`, `TriangleAlert`.
- `estimador.astro`: h1 `md:text-4xl`; aside `self-start`.
- Los colores por tipo de estancia (leyenda) se mantienen.

## Commits
- fix(estimador): cotas, rotulos y acentos de marca en el planificador (este commit)

## Verificación
- Playwright, 2 cargas seguidas de `/estimador` (planta → seleccionar Salón → final del panel → vista 3D): **0 errores de consola** (desaparece el de botón anidado).
- Capturas antes/después en default y dark a 1440 y a 375: sin scroll horizontal. Comparación HTML para el cliente.
- `npm run build`: Complete. `npx astro check`: 0 errors. `npm test`: 11 en verde (export y geometría intactos).
- Incidencia de entorno: tras añadir imports de lucide, Vite dejó la caché de dependencias desfasada (`504 Outdated Optimize Dep` al cargar `Scene3D.jsx`). Se confirmó la hipótesis reiniciando con `astro dev --force`: 0 errores.

## Pendiente
- Móvil del planificador (punto 8): propuesta de pestañas "Plano / Ajustes", a decidir por el cliente.
- Vista 3D: la maqueta se ve pequeña y centrada; mejorar el encuadre de cámara (F5-T3).
