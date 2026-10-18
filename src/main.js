import './styles/main.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initContours } from './js/contours.js';
import { initForms } from './js/leads.js';
import { CONFIG } from './js/config.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const ctx = { reduce, finePointer, lenis: null };
window.__ib = ctx;

/* ── Smooth scroll ── */
if (!reduce) {
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
  ctx.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── Contours ── */
initContours();

/* ── Header ── */
const header = document.querySelector('[data-header]');
let lastY = 0;
function headerTheme() {
  if (!header || header.classList.contains('menu-open')) return;
  const y = header.offsetHeight * 0.6;
  const el = document.elementsFromPoint(innerWidth / 2, y).find((n) => n.closest?.('[data-header-theme]') && !n.closest('[data-header]'));
  const sec = el?.closest('[data-header-theme]');
  header.classList.toggle('on-light', sec?.dataset.headerTheme === 'light');
}
function onScroll() {
  const y = scrollY;
  header?.classList.toggle('is-solid', y > 40);
  if (!header?.classList.contains('menu-open') && !document.body.classList.contains('drawer-open')) {
    header?.classList.toggle('is-hidden', y > lastY && y > 400 && !header.contains(document.activeElement));
  }
  lastY = y;
  headerTheme();
}
header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Mobile menu ── */
const menuBtn = document.querySelector('[data-menu-btn]');
const menu = document.querySelector('[data-menu]');
const background = [...document.querySelectorAll('main, .site-footer, .skip')];
function lockBackground(open) {
  background.forEach((el) => { el.inert = open; });
  document.body.style.overflow = open ? 'hidden' : '';
  open ? ctx.lenis?.stop() : ctx.lenis?.start();
}
if (menu) menu.inert = true;
function setMenu(open) {
  header.classList.toggle('menu-open', open);
  root.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.querySelector('b').textContent = open ? 'Fechar menu' : 'Abrir menu';
  menu.inert = !open;
  lockBackground(open);
  if (!open) menuBtn.focus({ preventScroll: true });
  if (open) header.classList.remove('is-hidden', 'on-light');
  else headerTheme();
}
menuBtn?.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
matchMedia('(min-width: 1080px)').addEventListener('change', (e) => {
  if (e.matches && header?.classList.contains('menu-open')) setMenu(false);
});

/* ── Split headings into lines ── */
function revealHeadings() {
  if (reduce) return;
  document.querySelectorAll('[data-split]').forEach((el) => {
    let entered = false;
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true, deepSlice: true,
      onSplit: (split) => {
        if (entered) return;
        return gsap.from(split.lines, {
          yPercent: 105, duration: 1.15, ease: 'expo.out', stagger: 0.09,
          delay: +(el.dataset.delay || 0),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true, onEnter: () => { entered = true; } },
        });
      },
    });
  });
}

/* ── Generic reveals ── */
function reveals() {
  if (reduce) return;
  ScrollTrigger.batch('[data-reveal]:not([data-reveal="clip"])', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => {
      // CSS transitions on transform would fight the tween — park them while it runs.
      els.forEach((e) => (e.style.transition = 'none'));
      gsap.to(els, {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
        onComplete: () => { gsap.set(els, { clearProps: 'transform,opacity' }); els.forEach((e) => { e.style.transition = ''; e.removeAttribute('data-reveal'); }); },
      });
    },
  });
  document.querySelectorAll('[data-reveal="clip"]').forEach((el) => {
    const img = el.querySelector('img');
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out' });
        if (img && !el.hasAttribute('data-parallax')) gsap.from(img, { scale: 1.25, duration: 1.8, ease: 'expo.out' });
      },
    });
  });
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return;
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  document.querySelectorAll('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed);
    gsap.to(el, { y: () => s * 120, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ── Statement: words light up as you read ── */
function statements() {
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = [...el.querySelectorAll('.w')];
    if (reduce) { spans.forEach((s) => s.classList.add('on')); return; }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (st) => {
        const n = Math.round(st.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('on', i < n));
      },
    });
  });
}

/* ── Magnetic buttons ── */
function magnetic() {
  if (!finePointer || reduce) return;
  document.querySelectorAll('.btn, .icon-btn').forEach((b) => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'expo.out' });
    const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'expo.out' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.22);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ── Survey cursor ── */
function surveyCursor() {
  const cur = document.querySelector('.survey-cursor');
  if (!cur || !finePointer) return;
  const lbl = cur.querySelector('[data-cursor-lbl]');
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'expo.out' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'expo.out' });
  let zone = null;
  addEventListener('pointermove', (e) => {
    xTo(e.clientX); yTo(e.clientY);
    const z = e.target.closest?.('[data-survey]');
    if (z !== zone) { zone = z; cur.classList.toggle('on', !!z); document.body.style.cursor = ''; }
    if (z) {
      const r = z.getBoundingClientRect();
      const lat = -27.1 - ((e.clientY - r.top) / r.height - 0.5) * 0.4;
      const lon = -52.62 + ((e.clientX - r.left) / r.width - 0.5) * 0.6;
      const f = (v, h) => `${Math.abs(v).toFixed(4)}°${h}`;
      lbl.textContent = z.dataset.survey === 'coords' ? `${f(lat, 'S')} ${f(lon, 'W')}` : z.dataset.survey;
    }
  }, { passive: true });
}

/* ── Drawer (interest list) ── */
const drawer = document.querySelector('[data-drawer]');
let lastFocus = null;
let drawerFocusTimer;
let drawerCloseTimer;
function openDrawer(course = '') {
  if (!drawer) return;
  clearTimeout(drawerCloseTimer);
  clearTimeout(drawerFocusTimer);
  lastFocus = document.activeElement;
  const form = drawer.querySelector('form');
  if (!form.querySelector('button[type=submit]').disabled) form.classList.remove('is-done');
  const sel = drawer.querySelector('[data-course-select]');
  const lab = drawer.querySelector('[data-course-label]');
  if (sel) sel.value = course || '';
  const opt = sel?.selectedOptions[0];
  lab.textContent = course && course !== 'geral' && opt ? ` em ${opt.textContent}` : '';
  drawer.hidden = false;
  document.body.classList.add('drawer-open');
  lockBackground(true);
  header.inert = true;
  menu.inert = true;
  header?.classList.remove('is-hidden');
  drawerFocusTimer = setTimeout(() => drawer.querySelector('.close')?.focus({ preventScroll: true }), reduce ? 0 : 450);
}
function closeDrawer() {
  document.body.classList.remove('drawer-open');
  clearTimeout(drawerFocusTimer);
  lockBackground(false);
  header.inert = false;
  drawerCloseTimer = setTimeout(() => { if (!document.body.classList.contains('drawer-open')) drawer.hidden = true; }, reduce ? 0 : 700);
  lastFocus?.focus?.({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-interest]');
  if (t) { e.preventDefault(); if (header?.classList.contains('menu-open')) setMenu(false); openDrawer(t.dataset.interest); }
  if (e.target.closest('[data-drawer-close]')) closeDrawer();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.body.classList.contains('drawer-open')) closeDrawer();
    if (header?.classList.contains('menu-open')) setMenu(false);
  }
  const drawerOpen = document.body.classList.contains('drawer-open');
  const menuOpen = header?.classList.contains('menu-open');
  if (e.key === 'Tab' && (drawerOpen || menuOpen)) {
    const scope = drawerOpen ? [drawer] : [header, menu];
    const f = scope.flatMap((el) => [...el.querySelectorAll('button, input, select, textarea, a[href]')]).filter((n) => !n.disabled && n.getClientRects().length && !n.closest('[inert]'));
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
drawer?.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

/* ── Channels from config ── */
function channels() {
  const wa = CONFIG.whatsappNumber ? `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}` : null;
  document.querySelectorAll('[data-whatsapp]').forEach((a) => { if (wa) { a.href = wa; a.target = '_blank'; a.rel = 'noopener'; } });
  document.querySelectorAll('[data-community]').forEach((a) => { if (CONFIG.communityUrl) { a.href = CONFIG.communityUrl; a.target = '_blank'; a.rel = 'noopener'; } });
  document.querySelectorAll('[data-social]').forEach((a) => {
    const url = CONFIG[`${a.dataset.social}Url`];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; } else a.closest('li')?.remove();
  });
  document.querySelectorAll('[data-whatsapp], [data-community]').forEach((a) => {
    if ((a.hasAttribute('data-whatsapp') && !wa) || (a.hasAttribute('data-community') && !CONFIG.communityUrl)) {
      a.href = '/contato.html?canal=' + (a.hasAttribute('data-whatsapp') ? 'whatsapp' : 'comunidade') + '#form';
    }
  });
  document.querySelectorAll('[data-legal]').forEach((a) => {
    const url = CONFIG[a.dataset.legal + 'Url'];
    if (url) a.href = url;
    else { const text = document.createElement('span'); text.textContent = a.textContent + ' (em preparação)'; a.replaceWith(text); }
  });
  document.querySelectorAll('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));
}

function scrollToAnchor(el, focus = false) {
  const offset = -(header?.offsetHeight || 84) - 16;
  if (ctx.lenis) ctx.lenis.scrollTo(el, { offset, immediate: !focus });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduce || !focus ? 'instant' : 'smooth' });
  if (focus) { if (!el.hasAttribute('tabindex')) el.tabIndex = -1; el.focus({ preventScroll: true }); }
}

/* ── Page transitions ── */
const veil = document.querySelector('.veil');
function leave(url) {
  if (reduce || !veil) { location.href = url; return; }
  gsap.timeline({ onComplete: () => (location.href = url) })
    .set(veil, { clipPath: 'inset(100% 0 0 0)' })
    .to(veil, { clipPath: 'inset(0% 0 0 0)', duration: 0.75, ease: 'expo.inOut' })
    .to(veil.querySelector('.veil-mark'), { opacity: 1, duration: 0.3 }, '-=0.25');
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.search === location.search && url.hash) {
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (el) { e.preventDefault(); history.pushState(null, '', url.hash); scrollToAnchor(el, true); }
    return;
  }
  if (url.pathname === location.pathname && url.search === location.search && !url.hash) return;
  e.preventDefault();
  leave(url.href);
});
addEventListener('pageshow', (e) => { if (e.persisted) { root.classList.remove('is-loading'); gsap.set(veil, { clipPath: 'inset(0 0 100% 0)' }); } });

/* ── Intro (loader on first visit, veil on navigation) ── */
function intro() {
  return new Promise((done) => {
    let settled = false;
    const resolve = () => { if (!settled) { settled = true; done(); } };
    setTimeout(() => { root.classList.remove('is-loading'); resolve(); }, 3200);
    if (root.classList.contains('first-visit') && !reduce) {
      const loader = document.querySelector('.loader');
      const pct = loader.querySelector('[data-loader-pct]');
      const o = { v: 0 };
      gsap.timeline({ onComplete: () => { loader.remove(); resolve(); } })
        .to(loader.querySelector('img'), { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.out' })
        .to(loader.querySelector('.loader-bar i'), { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.1)
        .to(o, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => (pct.textContent = String(Math.round(o.v)).padStart(3, '0')) }, 0.1)
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '+=0.15');
    } else if (root.classList.contains('is-loading') && !reduce && veil) {
      gsap.timeline({ onComplete: () => { root.classList.remove('is-loading'); resolve(); } })
        .to(veil.querySelector('.veil-mark'), { opacity: 0, duration: 0.25 })
        .to(veil, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'expo.inOut' }, 0.1);
    } else {
      root.classList.remove('is-loading', 'first-visit');
      document.querySelector('.loader')?.remove();
      resolve();
    }
  });
}

/* ── Hero entrance ── */
function heroIn() {
  const hero = document.querySelector('[data-hero]');
  if (!hero || reduce) return;
  const items = hero.querySelectorAll('[data-hero-in]');
  gsap.from(items, { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
}

/* ── Boot ── */
initForms();
channels();
revealHeadings();
document.fonts?.ready.then(() => ScrollTrigger.refresh());

const heroParam = new URLSearchParams(location.search).get('hero');
const HERO_VERSIONS = {
  1: ['Relevo', () => import('./three/terrain.js')],
  2: ['Lavoura', () => import('./three/field.js')],
  3: ['Grãos', () => import('./three/grains.js')],
  4: ['Pivôs', () => import('./three/pivots.js')],
  5: ['Maquete', () => import('./three/diorama.js')],
};
const heroVersion = HERO_VERSIONS[heroParam] ? heroParam : '2';
if (heroParam) {
  const host = document.querySelector('[data-terrain]');
  if (host) {
    const sw = document.createElement('nav');
    sw.className = 'hero-switch coord';
    sw.setAttribute('aria-label', 'Versão do fundo do hero');
    sw.innerHTML = Object.entries(HERO_VERSIONS)
      .map(([v, [name]]) => `<a href="?hero=${v}"${v === heroVersion ? ' aria-current="true"' : ''}>V${v} · ${name}</a>`)
      .join('');
    host.appendChild(sw);
  }
}

const modules = {
  // Hero background: V2 (lavoura de precisão) is the default; ?hero=1…5 loads the other concepts.
  '[data-terrain]': () => HERO_VERSIONS[heroVersion][1](),
  '[data-story]': () => import('./js/story.js'),
  '[data-plots]': () => import('./js/plots.js'),
  '[data-rail]': () => import('./js/rail.js'),
  '[data-xp]': () => import('./js/xp.js'),
  '[data-network]': () => import('./js/network.js'),
  '[data-globe]': () => import('./three/globe.js'),
  '[data-page-ui]': () => import('./js/page-ui.js'),
};
const loaded = Object.entries(modules)
  .filter(([sel]) => document.querySelector(sel))
  .map(([, load]) => load().then((m) => m.default?.(ctx)).catch((err) => console.error(err)));

intro().then(() => {
  heroIn();
  Promise.all(loaded).then(() => {
    root.classList.add('motion-ready');
    reveals();
    statements();
    magnetic();
    surveyCursor();
    ScrollTrigger.refresh();
    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) scrollToAnchor(target);
    }
  });
});
