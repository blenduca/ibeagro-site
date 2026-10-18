// Specialist network: six chain hubs orbit the institute; specialists (small nodes) gather around them,
// and knowledge pulses travel hub → IBEAGRO → hub.

const HUBS = [
  { label: 'LEITE', c: '#7cc46f' },
  { label: 'SUÍNOS', c: '#d44e23' },
  { label: 'AVES', c: '#f5b21f' },
  { label: 'COOPERATIVAS', c: '#3a9436' },
  { label: 'GESTÃO', c: '#3d8fd1' },
  { label: 'TECNOLOGIA', c: '#6fc3e8' },
];

export default function initNetwork(ctx) {
  const box = document.querySelector('[data-network]');
  const canvas = box.querySelector('canvas');
  const g = canvas.getContext('2d');
  let w = 0, h = 0, dpr = Math.min(devicePixelRatio, 2);
  const mouse = { x: -999, y: -999 };

  const hubs = HUBS.map((hb, i) => ({ ...hb, a: (i / HUBS.length) * Math.PI * 2 - Math.PI / 2, x: 0, y: 0 }));
  const nodes = [];
  hubs.forEach((hb, i) => {
    for (let k = 0; k < 9; k++) nodes.push({ hub: i, a: Math.random() * Math.PI * 2, r: 0.07 + Math.random() * 0.1, s: (Math.random() - 0.5) * 0.004, x: 0, y: 0, z: Math.random() });
  });
  // cross-links between specialists of different chains (interdisciplinary)
  const cross = [];
  for (let k = 0; k < 14; k++) {
    const a = Math.floor(Math.random() * nodes.length), b = Math.floor(Math.random() * nodes.length);
    if (nodes[a].hub !== nodes[b].hub) cross.push([a, b]);
  }
  const pulses = [];

  function resize() {
    const r = box.getBoundingClientRect();
    w = r.width; h = r.width; // square
    canvas.width = w * dpr; canvas.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(box);
  resize();
  box.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  box.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);

  let t = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    t += ctx.reduce ? 0 : 1;
    const cx = w / 2, cy = h * 0.46, R = w * 0.34;
    g.clearRect(0, 0, w, h);

    // orbit rings (contour-like)
    g.lineWidth = 1;
    for (let k = 1; k <= 4; k++) {
      g.beginPath();
      g.strokeStyle = `rgba(124,196,111,${0.06 + k * 0.025})`;
      g.setLineDash(k % 2 ? [2, 6] : []);
      g.ellipse(cx, cy, R * (k / 3.2), R * (k / 3.2), 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.setLineDash([]);

    hubs.forEach((hb) => {
      hb.a += ctx.reduce ? 0 : 0.0007;
      hb.x = cx + Math.cos(hb.a) * R;
      hb.y = cy + Math.sin(hb.a) * R;
    });
    nodes.forEach((n) => {
      n.a += ctx.reduce ? 0 : n.s;
      const hb = hubs[n.hub];
      let x = hb.x + Math.cos(n.a) * w * n.r;
      let y = hb.y + Math.sin(n.a) * w * n.r;
      const dx = x - mouse.x, dy = y - mouse.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 90) { x += (dx / d) * (90 - d) * 0.5; y += (dy / d) * (90 - d) * 0.5; }
      if (ctx.reduce) { n.x = x; n.y = y; }
      else { n.x += (x - n.x) * 0.1; n.y += (y - n.y) * 0.1; }
    });

    // edges
    nodes.forEach((n) => {
      const hb = hubs[n.hub];
      g.strokeStyle = 'rgba(124,196,111,.18)';
      g.beginPath(); g.moveTo(n.x, n.y); g.lineTo(hb.x, hb.y); g.stroke();
    });
    cross.forEach(([a, b]) => {
      g.strokeStyle = 'rgba(245,178,31,.12)';
      g.beginPath(); g.moveTo(nodes[a].x, nodes[a].y); g.lineTo(nodes[b].x, nodes[b].y); g.stroke();
    });
    hubs.forEach((hb) => {
      g.strokeStyle = 'rgba(124,196,111,.35)';
      g.beginPath(); g.moveTo(hb.x, hb.y); g.lineTo(cx, cy); g.stroke();
    });

    // pulses
    if (!ctx.reduce && t % 40 === 0) {
      const from = Math.floor(Math.random() * hubs.length);
      let to = Math.floor(Math.random() * hubs.length);
      if (to === from) to = (to + 1) % hubs.length;
      pulses.push({ from, to, p: 0 });
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pl = pulses[i];
      pl.p += 0.012;
      if (pl.p >= 1) { pulses.splice(i, 1); continue; }
      const a = pl.p < 0.5 ? hubs[pl.from] : { x: cx, y: cy };
      const b = pl.p < 0.5 ? { x: cx, y: cy } : hubs[pl.to];
      const q = (pl.p % 0.5) * 2;
      const x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q;
      g.fillStyle = '#f5b21f';
      g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(245,178,31,.18)';
      g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
    }

    // specialist nodes
    nodes.forEach((n) => {
      g.fillStyle = hubs[n.hub].c;
      g.globalAlpha = 0.55 + n.z * 0.45;
      g.beginPath(); g.arc(n.x, n.y, 2 + n.z * 2.5, 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;

    // hubs
    g.font = '500 10px "JetBrains Mono", monospace';
    g.textAlign = 'center';
    hubs.forEach((hb) => {
      g.fillStyle = '#02240f';
      g.beginPath(); g.arc(hb.x, hb.y, 13, 0, Math.PI * 2); g.fill();
      g.strokeStyle = hb.c; g.lineWidth = 2;
      g.beginPath(); g.arc(hb.x, hb.y, 13, 0, Math.PI * 2); g.stroke();
      g.fillStyle = hb.c;
      g.beginPath(); g.arc(hb.x, hb.y, 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b9d9b6';
      g.fillText(hb.label, hb.x, hb.y + (hb.y > cy ? 30 : -22));
    });
    g.lineWidth = 1;

    // centre
    const pr = 26 + Math.sin(t * 0.04) * 2;
    g.fillStyle = 'rgba(245,178,31,.12)';
    g.beginPath(); g.arc(cx, cy, pr + 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f5b21f';
    g.beginPath(); g.arc(cx, cy, pr, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#02240f';
    g.font = '800 11px "Archivo Variable", sans-serif';
    g.fillText('IBEAGRO', cx, cy + 4);
  }
  frame();
}
