// Validación estructural del JSON-LD por URL (F6-T3). Comprueba las propiedades que Google exige para
// cada tipo y la coherencia con la página (FAQ visible, migas que acaban en la URL, @id que existen).
// No sustituye al Rich Results Test (necesita la URL pública), pero lo deja pasar a la primera.
// Uso: node scripts/schema-check.mjs [baseUrl]   (por defecto http://localhost:4321; sitemap de dist/)
import { readFileSync } from 'node:fs';

const base = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '');
const SITE = 'https://is-instalaciones.es';
const BUSINESS_ID = `${SITE}#localbusiness`;
const SERVICE_PAGES = /^\/servicios\/[^/]+\/$/;

const sitemap = readFileSync(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/');

const textOf = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

function check(path, schemas, html) {
  const errs = [];
  const byType = (t) => schemas.filter((s) => [].concat(s['@type']).includes(t));
  const url = SITE + path;

  const [biz] = byType('HomeAndConstructionBusiness');
  if (!biz) errs.push('falta HomeAndConstructionBusiness');
  else {
    for (const k of ['@id', 'name', 'url', 'telephone', 'address', 'areaServed']) if (!biz[k]) errs.push(`negocio sin ${k}`);
    if (biz['@id'] !== BUSINESS_ID) errs.push(`@id del negocio = ${biz['@id']}`);
    const a = biz.address ?? {};
    if (!a.addressLocality || !a.addressCountry) errs.push('address sin localidad/país');
    if (a.streetAddress || a.postalCode || biz.geo) errs.push('negocio de zona de servicio con calle/CP/geo');
    if (![].concat(biz.sameAs ?? []).some((u) => u.includes('google.com/maps?cid='))) errs.push('sameAs sin la ficha de Google');
  }

  const crumbs = byType('BreadcrumbList');
  if (path === '/') {
    if (crumbs.length) errs.push('BreadcrumbList en la home');
  } else if (crumbs.length !== 1) errs.push(`${crumbs.length} BreadcrumbList`);
  else {
    const items = crumbs[0].itemListElement ?? [];
    items.forEach((it, i) => {
      if (it.position !== i + 1) errs.push(`miga ${i + 1} con position ${it.position}`);
      if (!it.name || !/^https:\/\//.test(it.item ?? '')) errs.push(`miga ${i + 1} sin name o item absoluto`);
    });
    if (items.length < 2) errs.push('BreadcrumbList con menos de 2 elementos');
    if (items.at(-1)?.item !== url) errs.push(`la última miga no es la URL (${items.at(-1)?.item})`);
  }

  const visible = textOf(html);
  for (const faq of byType('FAQPage')) {
    const qs = [].concat(faq.mainEntity ?? []);
    if (!qs.length) errs.push('FAQPage sin preguntas');
    for (const q of qs) {
      if (q['@type'] !== 'Question' || !q.name || !q.acceptedAnswer?.text) errs.push(`pregunta incompleta: ${q.name}`);
      else if (!visible.includes(q.name.trim())) errs.push(`pregunta del schema no visible en la página: «${q.name}»`);
    }
  }

  const services = byType('Service');
  if (SERVICE_PAGES.test(path)) {
    const own = services.find((s) => s.url === url);
    if (!own) errs.push('página de servicio sin su Service');
    else {
      if (own.provider?.['@id'] !== BUSINESS_ID) errs.push('Service sin provider = negocio');
      if (!own.name || !own.description || !own.areaServed) errs.push('Service sin name/description/areaServed');
    }
  }

  const types = schemas.map((s) => [].concat(s['@type']).join('+'));
  return { path, types, errs };
}

let total = 0;
for (const path of paths) {
  const html = await (await fetch(base + path)).text();
  const schemas = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      schemas.push(...[].concat(JSON.parse(m[1])));
    } catch (e) {
      schemas.push({ '@type': 'JSON-INVALIDO', error: e.message });
    }
  }
  const r = check(path, schemas, html);
  total += r.errs.length;
  console.log(`${r.errs.length ? '✗' : '✓'} ${r.path}  [${r.types.join(', ')}]`);
  for (const e of r.errs) console.log(`    - ${e}`);
}
console.log(`\nTotal: ${total} error(es) en ${paths.length} URL.`);
process.exitCode = total ? 1 : 0;
