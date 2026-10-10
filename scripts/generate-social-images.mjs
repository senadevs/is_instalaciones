// Genera las imágenes sociales (OG 1200x630) y los iconos del sitio (F6-T4).
// - OG: foto real de obra + marca, renderizado con Playwright desde una plantilla HTML -> public/og/<slug>.jpg
// - Iconos: a partir de public/img/logo.webp con sharp -> favicon-32x32.png, apple-touch-icon.png (180),
//   icon-192.png, icon-512.png, icon-maskable-512.png y favicon.ico (16/32/48, entradas PNG).
// Uso: node scripts/generate-social-images.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = (p) => `${root}public/${p}`;
// Recursos incrustados como data URI: una página creada con setContent no puede leer file://.
const MIME = { '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const asset = (p) => `data:${MIME[extname(p)]};base64,${readFileSync(`${root}${p}`).toString('base64')}`;

// Una imagen por página principal: foto propia del trabajo, titular y bajada.
export const OG_PAGES = [
  { slug: 'home', foto: 'reforma-salon-led.jpeg', titulo: 'Instalaciones y reformas en Barcelona', bajada: 'Electricidad, fontanería, climatización y reformas integrales' },
  { slug: 'servicios', foto: 'reforma-cocina-salon-led.jpeg', titulo: 'Servicios de instalaciones y reformas', bajada: 'Un solo equipo para toda la obra en Barcelona y área metropolitana' },
  { slug: 'instalaciones-electricas', foto: 'instalacion-electrica-cuadro-cableado.jpeg', titulo: 'Instalaciones eléctricas', bajada: 'Cuadros, boletines (CIE) e iluminación LED en Barcelona' },
  { slug: 'fontaneria-y-saneamiento', foto: 'fontaneria-tuberias.jpeg', titulo: 'Fontanería y saneamiento', bajada: 'Detección de fugas, tuberías y calderas en Barcelona' },
  { slug: 'climatizacion-y-calefaccion', foto: 'climatizacion-split-aire-acondicionado.jpeg', titulo: 'Climatización y calefacción', bajada: 'Aire acondicionado y calefacción: instalación y reparación' },
  { slug: 'reformas-integrales', foto: 'reforma-cocina-moderna-marmol.jpeg', titulo: 'Reformas integrales', bajada: 'Baños, cocinas y viviendas llave en mano en Barcelona' },
  { slug: 'nosotros', foto: 'reforma-pladur-proceso-equipo.jpeg', titulo: 'Sobre nosotros', bajada: 'Técnicos autorizados en instalaciones y reformas en Barcelona' },
  { slug: 'contacto', foto: 'reforma-obra-albanileria-equipo.jpeg', titulo: 'Pide tu presupuesto', bajada: 'Llámanos o escríbenos por WhatsApp: te respondemos rápido' },
  { slug: 'estimador', foto: 'reforma-salon-cocina-parquet.jpeg', titulo: 'Planificador 3D de reformas', bajada: 'Dibuja tu planta y expórtala en PDF, DXF o SVG' },
];

const fontFace = (family, file) =>
  `@font-face{font-family:'${family}';src:url('${asset(`node_modules/@fontsource-variable/${file}`)}') format('woff2');font-weight:100 900;}`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const plantilla = ({ foto, titulo, bajada }) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
${fontFace('Archivo', 'archivo/files/archivo-latin-wght-normal.woff2')}
${fontFace('Source Sans 3', 'source-sans-3/files/source-sans-3-latin-wght-normal.woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:'Source Sans 3',sans-serif;color:#fff;background:#0d1e23}
.foto{position:absolute;inset:0;background:url('${asset(`public/trabajos/${foto}`)}') center/cover}
.velo{position:absolute;inset:0;background:linear-gradient(100deg,rgba(13,30,35,.96) 0%,rgba(13,30,35,.88) 42%,rgba(4,106,83,.55) 72%,rgba(4,106,83,.15) 100%)}
.franja{position:absolute;left:0;top:0;bottom:0;width:14px;background:#046a53}
.contenido{position:absolute;left:84px;top:64px;bottom:64px;width:700px;display:flex;flex-direction:column}
.marca{display:flex;align-items:center;gap:18px}
.marca img{width:72px;height:72px;border-radius:50%;box-shadow:0 0 0 3px rgba(255,255,255,.85)}
.marca span{font-family:'Archivo',sans-serif;font-weight:700;font-size:30px;letter-spacing:.01em}
h1{margin-top:auto;font-family:'Archivo',sans-serif;font-weight:800;font-size:68px;line-height:1.02;text-transform:uppercase;letter-spacing:-.01em}
p{margin-top:22px;font-size:31px;line-height:1.3;color:rgba(255,255,255,.88);max-width:640px}
.pie{margin-top:36px;display:flex;align-items:center;gap:14px;font-size:26px;font-weight:600}
.pie i{display:inline-block;width:46px;height:4px;background:#2fbf8f;border-radius:2px}
</style></head><body>
<div class="foto"></div><div class="velo"></div><div class="franja"></div>
<div class="contenido">
  <div class="marca"><img src="${asset('public/img/logo.webp')}" alt=""><span>IS Instalaciones</span></div>
  <h1>${esc(titulo)}</h1>
  <p>${esc(bajada)}</p>
  <div class="pie"><i></i>is-instalaciones.es · 637 59 17 36</div>
</div></body></html>`;

async function generarOg() {
  mkdirSync(pub('og'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const og of OG_PAGES) {
    await page.setContent(plantilla(og), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: 'png' });
    await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(pub(`og/${og.slug}.jpg`));
    console.log(`og/${og.slug}.jpg`);
  }
  await browser.close();
}

// ICO con entradas PNG (válido en todos los navegadores actuales).
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

async function generarIconos() {
  const logo = readFileSync(pub('img/logo.webp'));
  const png = (size) => sharp(logo).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(pub('favicon-32x32.png'), await png(32));
  writeFileSync(pub('apple-touch-icon.png'), await png(180));
  writeFileSync(pub('icon-192.png'), await png(192));
  writeFileSync(pub('icon-512.png'), await png(512));
  // Maskable: el logo dentro de la zona segura (80 %), ampliando el lienzo con los píxeles del borde
  // para que el verde de fondo siga sin costuras.
  await sharp(logo)
    .resize(410, 410)
    .extend({ top: 51, bottom: 51, left: 51, right: 51, extendWith: 'copy' })
    .png()
    .toFile(pub('icon-maskable-512.png'));
  writeFileSync(pub('favicon.ico'), ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size) })))));
  console.log('favicon-32x32.png, apple-touch-icon.png, icon-192/512.png, icon-maskable-512.png, favicon.ico');
}

await generarOg();
await generarIconos();
