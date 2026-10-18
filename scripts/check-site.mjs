import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// Verifica a saída final com os partials já expandidos.
const root = resolve('dist');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = resolve(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const pages = walk(root).filter((p) => p.endsWith('.html'));
const ids = new Map(pages.map((p) => [p, [...readFileSync(p, 'utf8').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])]));
const errors = [];
for (const page of pages) {
  const name = relative(root, page);
  const html = readFileSync(page, 'utf8');
  const pageIds = ids.get(page);
  if (new Set(pageIds).size !== pageIds.length) errors.push(`${name}: ID duplicado`);
  if (html.includes('@include')) errors.push(`${name}: partial não expandido`);
  for (const [, attribute, value] of html.matchAll(/\b(href|src|aria-controls|aria-labelledby|for)="([^"]+)"/g)) {
    if (['aria-controls', 'aria-labelledby', 'for'].includes(attribute)) {
      for (const id of value.split(/\s+/)) if (!pageIds.includes(id)) errors.push(`${name}: ${attribute} aponta para #${id} inexistente`);
      continue;
    }
    const url = new URL(value, 'http://local/' + name);
    if (url.origin !== 'http://local') continue;
    const target = resolve(root, '.' + (url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname));
    if (!existsSync(target)) errors.push(`${name}: ${value} não encontrado`);
    else if (url.hash && ids.has(target) && !ids.get(target).includes(decodeURIComponent(url.hash.slice(1)))) errors.push(`${name}: âncora ${value} não encontrada`);
    if (value === '#') errors.push(`${name}: link vazio`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`${pages.length} páginas: links, imagens, ícones, âncoras, IDs e referências acessíveis verificados.`);
