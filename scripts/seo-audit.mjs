// Auditoría SEO on-page por URL (F6-T1). Lee las URLs del sitemap del build y las pide a un servidor
// (dev, preview o producción) para extraer title, description, h1, canonical, robots, OG y JSON-LD.
// Uso: node scripts/seo-audit.mjs [baseUrl] [--json]
//   baseUrl por defecto http://localhost:4321 · el sitemap se lee de dist/sitemap-0.xml (npm run build).
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:4321').replace(/\/$/, '');
const asJson = args.includes('--json');

const SITE = 'https://is-instalaciones.es';
const TITLE_MAX = 60;
const DESC_MAX = 155;

const sitemap = readFileSync(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/');
// Páginas que existen pero no deben faltar en la revisión aunque el sitemap no las liste.
for (const extra of ['/404']) if (!paths.includes(extra)) paths.push(extra);

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'))?.[1] ?? tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i'))?.[1];

function metas(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
}
function meta(html, key, val) {
  const tag = metas(html).find((t) => (attr(t, key) ?? '').toLowerCase() === val.toLowerCase());
  return tag ? decode(attr(tag, 'content') ?? '') : undefined;
}

function schemaTypes(html) {
  const types = [];
  const errors = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === 'object') {
          if (n['@type']) types.push([].concat(n['@type']).join('+'));
          if (n['@graph']) walk(n['@graph']);
        }
      };
      walk(JSON.parse(m[1]));
    } catch (e) {
      errors.push(`JSON-LD inválido: ${e.message}`);
    }
  }
  return { types, errors };
}

async function audit(path) {
  const res = await fetch(base + path, { redirect: 'manual' });
  const html = res.status < 300 || res.status === 404 ? await res.text() : '';
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = meta(html, 'name', 'description');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1]));
  const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i)?.[0];
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : undefined;
  const robots = meta(html, 'name', 'robots');
  const ogTitle = meta(html, 'property', 'og:title');
  const ogImage = meta(html, 'property', 'og:image');
  const keywords = meta(html, 'name', 'keywords');
  const lang = html.match(/<html\b[^>]*lang="([^"]+)"/i)?.[1];
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgsSinAlt = imgs.filter((t) => attr(t, 'alt') === undefined).length;
  const imgsSinDim = imgs.filter((t) => !attr(t, 'width') || !attr(t, 'height')).length;
  const { types, errors } = schemaTypes(html);

  const issues = [...errors];
  if (res.status !== 200 && path !== '/404') issues.push(`HTTP ${res.status}`);
  if (!title) issues.push('sin <title>');
  else if (title.length > TITLE_MAX) issues.push(`title ${title.length} car. (>${TITLE_MAX})`);
  if (!description) issues.push('sin meta description');
  else if (description.length > DESC_MAX) issues.push(`description ${description.length} car. (>${DESC_MAX})`);
  if (h1s.length !== 1) issues.push(`${h1s.length} h1`);
  if (!canonical) issues.push('sin canonical');
  else if (canonical !== SITE + path && canonical !== SITE + path.replace(/\/$/, '') && path !== '/404') issues.push(`canonical ≠ URL (${canonical})`);
  if (robots && /noindex/i.test(robots) && path !== '/404') issues.push(`robots: ${robots}`);
  if (path === '/404' && !(robots && /noindex/i.test(robots))) issues.push('404 sin noindex');
  if (!ogTitle) issues.push('sin og:title');
  if (!ogImage) issues.push('sin og:image');
  if (keywords !== undefined) issues.push('meta keywords (obsoleta)');
  if (!types.length && path !== '/404') issues.push('sin JSON-LD');
  if (imgsSinAlt) issues.push(`${imgsSinAlt} img sin alt`);
  // Las dimensiones son de rendimiento (CLS, F6-T5), no de on-page: aviso, no error.
  const warnings = imgsSinDim ? [`${imgsSinDim} img sin width/height`] : [];
  if (lang !== 'es') issues.push(`lang="${lang}"`);

  return { path, status: res.status, title, titleLen: title.length, description, descLen: description?.length ?? 0, h1s, canonical, robots, ogTitle: !!ogTitle, ogImage, schema: types, issues, warnings };
}

const results = [];
for (const p of paths) results.push(await audit(p));

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s ?? '—');
  console.log(`Auditoría SEO · ${base} · ${results.length} URL\n`);
  console.log('| URL | HTTP | title (car.) | desc. (car.) | h1 | canonical | indexable | OG | schema | problemas | avisos |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    console.log(
      `| \`${r.path}\` | ${r.status} | ${cut(r.title, 48)} (${r.titleLen}) | ${r.descLen} | ${r.h1s.length}: ${cut(r.h1s[0], 32)} | ${r.canonical ? (r.canonical.replace(SITE, '') || '/') : '—'} | ${r.robots && /noindex/i.test(r.robots) ? 'no' : 'sí'} | ${r.ogTitle ? 'título' : '—'}${r.ogImage ? '+img' : ''} | ${r.schema.join(', ') || '—'} | ${r.issues.join('; ') || 'OK'} | ${r.warnings.join('; ') || '—'} |`,
    );
  }
  const total = results.reduce((n, r) => n + r.issues.length, 0);
  console.log(`\nTotal: ${total} problema(s) en ${results.filter((r) => r.issues.length).length}/${results.length} URL.`);
  process.exitCode = total ? 1 : 0;
}
