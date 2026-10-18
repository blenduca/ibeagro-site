import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Soil profile: as the visitor reads, a root descends through the horizons and the plant above grows.

const W = 600, H = 1000, SURF = 330;
const BOUNDS = [SURF, 480, 640, 800, 1010];
const LAYERS = [
  { name: 'Horizonte A', depth: '0 – 30 cm', fill: '#0f522d' },
  { name: 'Horizonte B', depth: '30 – 80 cm', fill: '#0a4424' },
  { name: 'Horizonte C', depth: '80 – 140 cm', fill: '#05361b' },
  { name: 'Rocha-mãe', depth: '140 cm +', fill: '#022712' },
];

function wave(y, amp, seed) {
  const pts = [];
  for (let x = -20; x <= W + 20; x += 20) pts.push([x, y + Math.sin(x * 0.018 + seed) * amp + Math.sin(x * 0.045 + seed * 2) * amp * 0.4]);
  return pts;
}
const toPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');

function rand(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

function build() {
  const r = rand(42);
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" fill="none">`;
  // layers
  for (let i = 0; i < LAYERS.length; i++) {
    const top = wave(BOUNDS[i], i === 0 ? 6 : 10, i * 1.7);
    const bot = wave(BOUNDS[i + 1], 10, (i + 1) * 1.7).reverse();
    s += `<path class="lay" data-i="${i}" d="${toPath(top)}${toPath(bot).replace('M', 'L')}Z" fill="${LAYERS[i].fill}"/>`;
    // pebbles / texture
    const n = 26 + i * 10;
    for (let k = 0; k < n; k++) {
      const x = r() * W, y = BOUNDS[i] + 14 + r() * (BOUNDS[i + 1] - BOUNDS[i] - 24);
      const rr = i === 3 ? 3 + r() * 10 : 1 + r() * (2 + i * 1.5);
      s += `<ellipse class="peb" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * (0.55 + r() * 0.3)).toFixed(1)}" fill="${i === 3 ? '#0a3a1e' : '#2d6241'}" opacity="${(0.25 + r() * 0.45).toFixed(2)}"/>`;
    }
    // boundary contour
    s += `<path d="${toPath(top)}" stroke="#7cc46f" stroke-opacity="${i === 0 ? 0.9 : 0.35}" stroke-width="${i === 0 ? 1.6 : 1}" stroke-dasharray="${i === 0 ? '0' : '4 6'}" vector-effect="non-scaling-stroke"/>`;
    // label
    const ly = (BOUNDS[i] + BOUNDS[i + 1]) / 2;
    s += `<g class="lbl" data-i="${i}" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="1">
      <line x1="${W - 150}" y1="${ly}" x2="${W - 30}" y2="${ly}" stroke="#7cc46f" stroke-opacity=".5"/>
      <text x="${W - 30}" y="${ly - 10}" text-anchor="end" fill="#b9d9b6">${LAYERS[i].name.toUpperCase()}</text>
      <text x="${W - 30}" y="${ly + 22}" text-anchor="end" fill="#7cc46f">${LAYERS[i].depth}</text></g>`;
  }
  // grass tufts on the surface
  for (let x = 10; x < W; x += 14 + r() * 18) {
    const y = SURF + Math.sin(x * 0.018) * 6 + Math.sin(x * 0.045) * 2.4;
    const h = 8 + r() * 14;
    s += `<path d="M${x} ${y} q ${-3 + r() * 2} ${-h / 2} ${-5 + r() * 3} ${-h} M${x} ${y} q 2 ${-h / 2} ${4 + r() * 3} ${-h * 0.8}" stroke="#3a9436" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  // plant
  const cx = 230;
  s += `<path class="stem" d="M${cx} ${SURF} C ${cx - 4} ${SURF - 60}, ${cx + 6} ${SURF - 120}, ${cx} ${SURF - 210}" stroke="#56a050" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path class="leaf" data-k="0" d="M${cx + 1} ${SURF - 80} C ${cx + 40} ${SURF - 120}, ${cx + 88} ${SURF - 110}, ${cx + 104} ${SURF - 138} C ${cx + 70} ${SURF - 150}, ${cx + 22} ${SURF - 132}, ${cx + 1} ${SURF - 80}Z" fill="#3a9436"/>`;
  s += `<path class="leaf" data-k="1" d="M${cx - 1} ${SURF - 130} C ${cx - 36} ${SURF - 160}, ${cx - 84} ${SURF - 150}, ${cx - 98} ${SURF - 180} C ${cx - 64} ${SURF - 192}, ${cx - 20} ${SURF - 178}, ${cx - 1} ${SURF - 130}Z" fill="#56a050"/>`;
  s += `<path class="leaf" data-k="2" d="M${cx} ${SURF - 168} C ${cx + 28} ${SURF - 196}, ${cx + 60} ${SURF - 194}, ${cx + 74} ${SURF - 214} C ${cx + 48} ${SURF - 226}, ${cx + 14} ${SURF - 212}, ${cx} ${SURF - 168}Z" fill="#7cc46f"/>`;
  // grain head (gold)
  let grains = '';
  for (let k = 0; k < 9; k++) {
    const gy = SURF - 214 - k * 11;
    grains += `<ellipse cx="${cx - 6}" cy="${gy}" rx="6" ry="9" transform="rotate(-24 ${cx - 6} ${gy})" fill="#f5b21f"/><ellipse cx="${cx + 6}" cy="${gy - 5}" rx="6" ry="9" transform="rotate(24 ${cx + 6} ${gy - 5})" fill="#e09e0c"/>`;
  }
  s += `<g class="grain">${grains}</g>`;
  // roots
  const main = `M${cx} ${SURF} C ${cx - 10} ${SURF + 60}, ${cx + 22} ${SURF + 120}, ${cx + 4} ${SURF + 190} S ${cx - 26} ${SURF + 320}, ${cx + 6} ${SURF + 410} S ${cx - 14} ${SURF + 540}, ${cx + 2} ${SURF + 640}`;
  s += `<path class="root main" d="${main}" stroke="#f5b21f" stroke-width="3.2" stroke-linecap="round"/>`;
  const branches = [
    [SURF + 40, -1, 90, 40], [SURF + 70, 1, 110, 60], [SURF + 150, -1, 120, 70], [SURF + 200, 1, 150, 60],
    [SURF + 300, -1, 140, 80], [SURF + 360, 1, 170, 90], [SURF + 470, -1, 130, 70], [SURF + 520, 1, 120, 80], [SURF + 600, -1, 80, 50],
  ];
  branches.forEach(([y, dir, len, drop], k) => {
    const x0 = cx + Math.sin(y * 0.02) * 10;
    s += `<path class="root br" data-at="${((y - SURF) / 640).toFixed(3)}" d="M${x0} ${y} q ${dir * len * 0.4} ${drop * 0.2} ${dir * len * 0.7} ${drop * 0.6} t ${dir * len * 0.3} ${drop * 0.4}" stroke="${k % 2 ? '#e7c45e' : '#b9d9b6'}" stroke-opacity=".85" stroke-width="1.6" stroke-linecap="round"/>`;
  });
  // root tip glow
  s += `<circle class="tip" r="6" fill="#f5b21f"/><circle class="tip-ring" r="14" stroke="#f5b21f" stroke-opacity=".5"/>`;
  s += `</svg>`;
  return s;
}

export default function initStory(ctx) {
  const sec = document.querySelector('[data-story]');
  const fig = sec.querySelector('[data-soil]');
  fig.innerHTML = build();
  const svg = fig.querySelector('svg');
  const main = svg.querySelector('.root.main');
  const brs = [...svg.querySelectorAll('.root.br')];
  const stem = svg.querySelector('.stem');
  const leaves = [...svg.querySelectorAll('.leaf')];
  const grain = svg.querySelector('.grain');
  const tip = svg.querySelector('.tip');
  const ring = svg.querySelector('.tip-ring');
  const depth = sec.querySelector('[data-depth]');
  const layers = [...svg.querySelectorAll('.lay')];
  const labels = [...svg.querySelectorAll('.lbl')];

  const L = main.getTotalLength();
  const prep = (p) => { const l = p.getTotalLength(); p.style.strokeDasharray = `${l}`; p.style.strokeDashoffset = `${l}`; p.dataset.len = l; };
  [main, ...brs, stem].forEach(prep);
  leaves.forEach((l) => { l.style.transformBox = 'fill-box'; l.style.transformOrigin = l.dataset.k === '1' ? '100% 100%' : '0% 100%'; l.style.transform = 'scale(0)'; });
  grain.style.transformBox = 'fill-box';
  grain.style.transformOrigin = '50% 100%';
  grain.style.transform = 'scale(0)';

  const setActive = (i) => {
    layers.forEach((l, k) => l.setAttribute('fill-opacity', k === i ? '1' : '0.72'));
    labels.forEach((l, k) => { l.style.opacity = k === i ? '1' : '0.35'; });
  };
  setActive(0);

  const render = (p) => {
    const rp = gsap.utils.clamp(0, 1, p / 0.92);
    main.style.strokeDashoffset = String(L * (1 - rp));
    const pt = main.getPointAtLength(L * rp);
    tip.setAttribute('cx', pt.x); tip.setAttribute('cy', pt.y);
    ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y);
    brs.forEach((b) => {
      const at = +b.dataset.at;
      const k = gsap.utils.clamp(0, 1, (rp - at) / 0.12);
      b.style.strokeDashoffset = String(+b.dataset.len * (1 - k));
    });
    const sp = gsap.utils.clamp(0, 1, p / 0.45);
    stem.style.strokeDashoffset = String(+stem.dataset.len * (1 - sp));
    leaves.forEach((l, k) => {
      const lp = gsap.utils.clamp(0, 1, (p - 0.12 - k * 0.14) / 0.2);
      l.style.transform = `scale(${gsap.parseEase('back.out(1.6)')(lp)})`;
    });
    const gp = gsap.utils.clamp(0, 1, (p - 0.8) / 0.15);
    grain.style.transform = `scale(${gsap.parseEase('back.out(1.4)')(gp)})`;
    if (depth) depth.textContent = `${(rp * 1.6).toFixed(2).replace('.', ',')} m`;
    const li = Math.min(3, Math.floor(((pt.y - SURF) / (1000 - SURF)) * 4.2));
    setActive(Math.max(0, li));
  };

  if (ctx.reduce) { render(1); return; }
  render(0);
  ScrollTrigger.create({
    trigger: sec.querySelector('.strata'),
    start: 'top 60%',
    end: 'bottom 70%',
    scrub: 0.6,
    onUpdate: (st) => render(st.progress),
  });
  gsap.to(ring, { attr: { r: 22 }, opacity: 0, duration: 1.6, repeat: -1, ease: 'expo.out' });

  // chapters: each text enters with a soft rise
  sec.querySelectorAll('.stratum-copy').forEach((c) => {
    gsap.from(c.children, {
      opacity: 0, y: 40, duration: 1.1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: c, start: 'top 75%', once: true },
    });
  });
}
