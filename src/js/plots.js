import gsap from 'gsap';

// Survey plots: each knowledge area is a land parcel in its emblem colour.
export default function initPlots(ctx) {
  const root = document.querySelector('[data-plots]');
  const plots = [...root.querySelectorAll('.plot')];
  const cards = plots.map((p) => document.getElementById(p.getAttribute('aria-controls')));
  let idx = 0;

  function select(i, focus = false) {
    idx = (i + plots.length) % plots.length;
    plots.forEach((p, k) => {
      const on = k === idx;
      p.classList.toggle('is-active', on);
      p.setAttribute('aria-selected', String(on));
      p.tabIndex = on ? 0 : -1;
      cards[k].hidden = !on;
    });
    if (focus) plots[idx].focus();
    const card = cards[idx];
    gsap.killTweensOf(card.children);
    if (!ctx.reduce) gsap.fromTo(card.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 });
  }

  plots.forEach((p, k) => {
    p.addEventListener('click', () => select(k));
    p.addEventListener('keydown', (e) => {
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(plots.length - 1, true); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(idx + 1, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(idx - 1, true); }
    });
    if (ctx.finePointer) p.addEventListener('pointerenter', () => select(k));
  });
  root.querySelector('[data-plot-prev]')?.addEventListener('click', () => select(idx - 1));
  root.querySelector('[data-plot-next]')?.addEventListener('click', () => select(idx + 1));
  plots[0].classList.add('is-active');
  plots.forEach((p, k) => (p.tabIndex = k ? -1 : 0));

  if (ctx.reduce) return;
  // the field "unfolds" from a flat map into the isometric survey as it scrolls in
  const grid = root.querySelector('.plots');
  const small = matchMedia('(max-width: 640px)').matches;
  gsap.fromTo(grid, { rotateX: 0, rotateZ: 0, scale: small ? 0.66 : 0.78 }, {
    rotateX: 54, rotateZ: -38, scale: small ? 0.72 : 0.86, ease: 'none',
    scrollTrigger: { trigger: root, start: 'top 95%', end: 'top 35%', scrub: 0.8 },
  });
}
