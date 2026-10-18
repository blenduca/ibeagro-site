import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { drawContours } from './contours.js';

// Interactions for inner pages: filters, tabs, process, learning path, biosecurity zones, contact paths, HQ map.

function filters(reduce) {
  const group = document.querySelector('[data-filters]');
  if (!group) return;
  const rows = [...document.querySelectorAll('.c-row[data-area]')];
  const empty = document.querySelector('[data-empty]');
  group.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    group.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const f = b.dataset.filter;
    let shown = 0;
    rows.forEach((r) => {
      const on = f === 'all' || r.dataset.area === f;
      r.classList.toggle('is-hidden', !on);
      if (on) { shown++; gsap.killTweensOf(r); gsap.fromTo(r, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: reduce ? 0 : 0.7, ease: 'expo.out', delay: reduce ? 0 : shown * 0.05 }); }
    });
    empty.hidden = shown > 0;
    if (!shown) gsap.fromTo(empty, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: reduce ? 0 : 0.7, ease: 'expo.out' });
    ScrollTrigger.refresh();
  });
}

function tabs(reduce) {
  const root = document.querySelector('[data-tabs]');
  if (!root) return;
  const btns = [...root.querySelectorAll('[role="tab"]')];
  const select = (b, focus) => {
    btns.forEach((x) => {
      const on = x === b;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      const p = document.getElementById(x.getAttribute('aria-controls'));
      p.hidden = !on;
      if (on && !reduce) {
        gsap.killTweensOf([p.querySelector('.media'), p.querySelector('.cap')]);
        gsap.fromTo(p.querySelector('.media'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.out' });
        gsap.fromTo(p.querySelector('.cap'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.15 });
      }
    });
    if (focus) b.focus();
    ScrollTrigger.refresh();
  };
  btns.forEach((b) => { b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1; });
  root.addEventListener('click', (e) => { const b = e.target.closest('[role="tab"]'); if (b) select(b); });
  root.addEventListener('keydown', (e) => {
    const i = btns.indexOf(document.activeElement);
    if (e.key === 'Home') { e.preventDefault(); select(btns[0], true); }
    if (e.key === 'End') { e.preventDefault(); select(btns.at(-1), true); }
    if (i < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select(btns[(i + 1) % btns.length], true); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select(btns[(i - 1 + btns.length) % btns.length], true); }
  });
}

function processLine(reduce) {
  const root = document.querySelector('[data-process]');
  if (!root) return;
  const steps = [...root.querySelectorAll('.step')];
  const line = root.querySelector('.process-line i');
  if (reduce) { steps.forEach((s) => s.classList.add('on')); return; }
  ScrollTrigger.create({
    trigger: root,
    start: 'top 70%',
    end: 'bottom 55%',
    scrub: true,
    onUpdate: (st) => {
      if (line) line.style.transform = `scaleX(${st.progress})`;
      steps.forEach((s, i) => s.classList.toggle('on', st.progress >= i / steps.length + 0.05));
    },
  });
  gsap.from(steps, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: root, start: 'top 80%', once: true } });
}

function learnPath(reduce) {
  const path = document.querySelector('[data-learn]');
  if (!path) return;
  const fill = path.querySelector('.fill');
  const items = [...path.querySelectorAll('li')];
  if (reduce) { items.forEach((i) => i.classList.add('on')); return; }
  ScrollTrigger.create({
    trigger: path,
    start: 'top 65%',
    end: 'bottom 60%',
    scrub: true,
    onUpdate: (st) => {
      fill.style.height = `${st.progress * (path.offsetHeight - 20)}px`;
      items.forEach((it, i) => it.classList.toggle('on', st.progress >= i / items.length));
    },
  });
}

function zones() {
  const root = document.querySelector('[data-zones]');
  if (!root) return;
  const svg = root.querySelector('svg');
  const rings = [...svg.querySelectorAll('.ring')];
  const btns = [...root.querySelectorAll('.zone-list button')];
  const set = (z) => {
    svg.classList.toggle('has-on', z !== null);
    rings.forEach((r) => r.classList.toggle('on', r.dataset.z === z));
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.z === z)));
  };
  btns.forEach((b) => {
    b.addEventListener('click', () => set(b.dataset.z));
    b.addEventListener('focus', () => set(b.dataset.z));
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(b.dataset.z); });
  });
  rings.forEach((r) => r.addEventListener('click', () => set(r.dataset.z)));
}

function contactPaths(reduce) {
  const root = document.querySelector('[data-paths]');
  if (!root) return;
  const form = document.querySelector('form[data-form="contato"]');
  const motivo = form.querySelector('[data-motivo]');
  const title = document.querySelector('[data-form-title]');
  const titles = { geral: 'Fale com o IBEAGRO', especialista: 'Seja um especialista parceiro', parceria: 'Proponha uma parceria institucional' };
  const apply = (p) => {
    form.classList.remove('is-done');
    motivo.value = p;
    form.querySelectorAll('[data-only]').forEach((f) => {
      f.hidden = !f.dataset.only.split(' ').includes(p);
      f.querySelectorAll('input,select,textarea').forEach((el) => { el.disabled = f.hidden; });
    });
    root.querySelectorAll('[data-path]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.path === p)));
    if (title) title.textContent = titles[p] || titles.geral;
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-path]');
    if (!b) return;
    apply(b.dataset.path);
    const target = document.getElementById('form');
    window.__ib?.lenis ? window.__ib.lenis.scrollTo(target, { offset: -40 }) : target.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
    setTimeout(() => form.querySelector('input:not([type=hidden])')?.focus({ preventScroll: true }), reduce ? 0 : 900);
  });
  const q = new URLSearchParams(location.search).get('perfil');
  apply(q && Object.hasOwn(titles, q) ? q : 'geral');
  const channel = new URLSearchParams(location.search).get('canal');
  if (channel === 'whatsapp' || channel === 'comunidade') {
    title.textContent = channel === 'comunidade' ? 'Saiba mais sobre a comunidade' : 'Converse com o IBEAGRO';
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = channel === 'comunidade' ? 'O link da comunidade será divulgado em breve. Você pode solicitar informações pelo formulário.' : 'O WhatsApp oficial será divulgado em breve. Você pode entrar em contato pelo formulário.';
    title.after(note);
  }
}

function hqMap(reduce) {
  const box = document.querySelector('[data-hq-map]');
  if (!box) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  box.appendChild(svg);
  drawContours(svg, { seed: 'chapeco', width: 600, height: 600, hills: 3 });
  const g = document.createElementNS(ns, 'g');
  g.innerHTML = `
    <g stroke="rgba(124,196,111,.18)">${[100, 200, 300, 400, 500].map((v) => `<path d="M${v} 0V600M0 ${v}H600"/>`).join('')}</g>
    <g class="hq-pulse" fill="none" stroke="#f5b21f"><circle cx="300" cy="300" r="30" opacity=".7"/><circle cx="300" cy="300" r="60" opacity=".4"/><circle cx="300" cy="300" r="95" opacity=".2"/></g>
    <path d="M300 230V285M300 315V370M230 300H285M315 300H370" stroke="#f5b21f" stroke-width="2"/>
    <circle cx="300" cy="300" r="9" fill="#f5b21f"/>
    <text x="318" y="282" fill="#fff" font-family="Archivo Variable, sans-serif" font-weight="760" font-size="22">Chapecó</text>
    <text x="318" y="262" fill="#7cc46f" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="1">SC · BRASIL</text>`;
  svg.appendChild(g);
  if (!reduce) gsap.to(svg.querySelectorAll('.hq-pulse circle'), { attr: { r: '+=30' }, opacity: 0, duration: 2.4, repeat: -1, ease: 'expo.out', stagger: 0.5 });
}

function modes(reduce) {
  const root = document.querySelector('[data-modes]');
  if (!root || reduce) return;
  gsap.to(root.querySelectorAll('.m-wave'), { attr: { r: '+=10' }, opacity: 0, duration: 1.8, repeat: -1, ease: 'expo.out', stagger: 0.4 });
  gsap.fromTo(root.querySelector('.m-crowd').children, { y: 6 }, { y: -2, duration: 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.15 });
  const l = root.querySelector('.m-l'), r = root.querySelector('.m-r'), mid = root.querySelector('.m-mid');
  gsap.timeline({ repeat: -1, repeatDelay: 0.6, yoyo: true })
    .fromTo(l, { x: -18 }, { x: 0, duration: 1.4, ease: 'expo.inOut' }, 0)
    .fromTo(r, { x: 18 }, { x: 0, duration: 1.4, ease: 'expo.inOut' }, 0)
    .fromTo(mid, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.6);
  const path = root.querySelector('.m-path');
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  const dot = root.querySelector('.m-dot');
  const o = { p: 0 };
  gsap.to(o, {
    p: 1, duration: 3, repeat: -1, repeatDelay: 0.8, ease: 'power1.inOut',
    onUpdate: () => {
      path.style.strokeDashoffset = len * (1 - o.p);
      const pt = path.getPointAtLength(len * o.p);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    },
  });
}

export default function initPageUi(ctx) {
  filters(ctx.reduce);
  tabs(ctx.reduce);
  processLine(ctx.reduce);
  learnPath(ctx.reduce);
  zones();
  contactPaths(ctx.reduce);
  hqMap(ctx.reduce);
  modes(ctx.reduce);
}
