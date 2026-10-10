# 009 — Quitar «más de 500 proyectos» de la web

- **Fecha/hora:** 2026-10-01 13:00
- **Tipo:** fix
- **Mejora a:** 006
- **Tarea:** —
- **Stack:** astro

## Qué se hizo
- Petición del cliente: "en la web quita lo de más de 500 trabajos" (dato aproximado, no respaldable).
- `nosotros.astro`: fuera la tarjeta "+500 Proyectos realizados"; la rejilla pasa de 4 a 3 columnas (`grid-cols-1 sm:grid-cols-3`, `max-w-3xl`) para no dejar hueco.
- `servicios/index.astro` y `servicios/reformas-integrales.astro`: frase sin la cifra.
- `src/data/knowledge.md` (base del chat), `public/llms.txt` y `public/llm.txt`: fuera la línea.
- `gustos.md`: anotado que no se reintroduzcan cifras de proyectos sin dato confirmado.

## Commits
- fix(contenido): quitar la cifra de mas de 500 proyectos (este commit)

## Verificación
- `grep -rni "500 proyectos\|+500\|500 trabajos" src public/llm*.txt` → sin resultados.
- `npm run build`: Complete.
- Fuera de alcance, para confirmar con el cliente: `/escombros` muestra un contador "500+ contenedores y sacas servidos" marcado `PENDIENTE-CONFIRMAR` en `Contadores.astro:6`.

## Próximos pasos
- F5: mejorar el diseño del estimador/planificador (auditoría visual con capturas primero).
