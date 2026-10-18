// Procedural topographic contours drawn into an <svg>.
// Closed iso-rings around a few "hills", radius perturbed by smooth angular noise.

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function drawContours(svg, opts = {}) {
  const seed = hash(opts.seed || svg.dataset.contours || 'ibeagro');
  const rnd = mulberry(seed);
  const W = opts.width || 1600;
  const H = opts.height || 1000;
  const stroke = opts.stroke || svg.dataset.stroke || 'rgba(124,196,111,.55)';
  const accent = opts.accent || svg.dataset.accent || 'rgba(245,178,31,.85)';
  const hills = opts.hills || 4;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('fill', 'none');
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('stroke-linecap', 'round');

  for (let k = 0; k < hills; k++) {
    const cx = W * (0.1 + rnd() * 0.8);
    const cy = H * (0.1 + rnd() * 0.8);
    const rings = 7 + Math.floor(rnd() * 9);
    const step = 26 + rnd() * 34;
    const harmonics = [1, 2, 3, 5].map((f) => ({ f, a: rnd() * 0.22 / f, p: rnd() * Math.PI * 2 }));
    const stretch = 0.65 + rnd() * 0.7;
    const rot = rnd() * Math.PI;
    for (let r = 1; r <= rings; r++) {
      const R = r * step;
      const pts = [];
      const N = 96;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        let m = 1;
        for (const h of harmonics) m += h.a * Math.sin(h.f * t + h.p + r * 0.18);
        const x0 = Math.cos(t) * R * m;
        const y0 = Math.sin(t) * R * m * stretch;
        pts.push([cx + x0 * Math.cos(rot) - y0 * Math.sin(rot), cy + x0 * Math.sin(rot) + y0 * Math.cos(rot)]);
      }
      // Catmull-Rom → cubic Bézier, closed
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < N; i++) {
        const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d + 'Z');
      const major = r % 5 === 0;
      path.setAttribute('stroke', major && k === 0 ? accent : stroke);
      path.setAttribute('stroke-width', major ? '1.6' : '0.8');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.style.opacity = String(0.35 + 0.65 * (1 - r / rings));
      path.classList.add('iso');
      g.appendChild(path);
    }
  }
  svg.replaceChildren(g);
  return svg;
}

export function initContours(root = document) {
  root.querySelectorAll('svg[data-contours]').forEach((svg) => {
    if (!svg.childElementCount) drawContours(svg);
  });
}
