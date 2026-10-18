import { defineConfig } from 'vite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// Partials: <!-- @include header {"page":"home"} --> → partials/header.html with {{page}} vars.
// Inside partials, {{#is page=home}}…{{/is}} renders only when the var matches.
function partials() {
  const render = (name, vars, depth = 0) => {
    const file = resolve(root, 'partials', `${name}.html`);
    let html = readFileSync(file, 'utf8');
    html = html.replace(/\{\{#is (\w+)=([\w-]+)\}\}([\s\S]*?)\{\{\/is\}\}/g, (_, k, v, body) => (vars[k] === v ? body : ''));
    html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
    return depth < 3 ? expand(html, depth + 1) : html;
  };
  const expand = (html, depth = 0) =>
    html.replace(/<!--\s*@include\s+([\w-]+)\s*(\{.*?\})?\s*-->/g, (_, name, json) =>
      render(name, json ? JSON.parse(json) : {}, depth)
    );
  return {
    name: 'ibeagro-partials',
    transformIndexHtml: { order: 'pre', handler: (html) => expand(html) },
    handleHotUpdate({ file, server }) {
      if (file.includes('/partials/')) server.ws.send({ type: 'full-reload' });
    },
  };
}

// Under a sub-path base (GitHub Pages), prefix root-relative links Vite doesn't rewrite itself.
function baseLinks() {
  let base = '/';
  return {
    name: 'ibeagro-base-links',
    configResolved(c) { base = c.base; },
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        base === '/' ? html : html.replace(/\b(href|content)="\/(?!\/)/g, (m, a, off) => (html.startsWith(`${base}`, off + m.length - 1) ? m : `${a}="${base}`)),
    },
    transform(code, id) {
      if (base === '/' || !id.includes('/src/') || !id.endsWith('.js')) return null;
      return code.replace(/(['"])\/(img\/|contato\.html)/g, `$1${base}$2`);
    },
  };
}

const pages = Object.fromEntries(
  [
    ...readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => [f.replace('.html', ''), resolve(root, f)]),
    ...(existsSync(resolve(root, 'cursos'))
      ? readdirSync(resolve(root, 'cursos'))
          .filter((f) => f.endsWith('.html'))
          .map((f) => [`cursos/${f.replace('.html', '')}`, resolve(root, 'cursos', f)])
      : []),
  ]
);

export default defineConfig({
  plugins: [partials(), baseLinks()],
  base: process.env.BASE_PATH || '/',
  build: { rollupOptions: { input: pages }, chunkSizeWarningLimit: 900 },
  server: { host: true, port: 5180 },
});
