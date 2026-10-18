import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { feature } from 'topojson-client';
import { geoPath, geoEquirectangular } from 'd3-geo';
import countries from 'world-atlas/countries-110m.json';

// Dotted globe: Chapecó (gold) → Brasil (highlighted) → América Latina (arcs to each country).

const HQ = { name: 'Chapecó', lat: -27.1004, lon: -52.6152 };
export const DESTS = [
  { name: 'Peru', city: 'Lima', lat: -12.05, lon: -77.04 },
  { name: 'Chile', city: 'Santiago', lat: -33.45, lon: -70.67 },
  { name: 'Argentina', city: 'Buenos Aires', lat: -34.6, lon: -58.38 },
  { name: 'Uruguai', city: 'Montevidéu', lat: -34.9, lon: -56.16 },
  { name: 'Paraguai', city: 'Assunção', lat: -25.26, lon: -57.58 },
  { name: 'Bolívia', city: 'La Paz', lat: -16.5, lon: -68.15 },
  { name: 'Equador', city: 'Quito', lat: -0.18, lon: -78.47 },
  { name: 'Colômbia', city: 'Bogotá', lat: 4.71, lon: -74.07 },
  { name: 'Venezuela', city: 'Caracas', lat: 10.48, lon: -66.9 },
  { name: 'México', city: 'Cidade do México', lat: 19.43, lon: -99.13 },
];
const LATAM = new Set(['484', '320', '084', '340', '222', '558', '188', '591', '192', '214', '332', '170', '862', '218', '604', '068', '600', '152', '032', '858', '328', '740', '630', '254']);
const BRAZIL = '076';

const toVec = (lat, lon, r = 1) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

function landMask() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
  const path = geoPath(proj, g);
  const fc = feature(countries, countries.objects.countries);
  fc.features.forEach((f) => {
    g.beginPath();
    path(f);
    g.fillStyle = f.id === BRAZIL ? 'rgb(255,0,0)' : LATAM.has(f.id) ? 'rgb(170,0,0)' : 'rgb(85,0,0)';
    g.fill();
  });
  const data = g.getImageData(0, 0, W, H).data;
  return (lat, lon) => {
    const x = Math.floor(((lon + 180) / 360) * W) % W;
    const y = Math.floor(((90 - lat) / 180) * H);
    return data[(y * W + x) * 4];
  };
}

export default function initGlobe(ctx) {
  const box = document.querySelector('[data-globe]');
  if (!box) return;
  const canvas = box.querySelector('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 4.4);

  const globe = new THREE.Group();
  scene.add(globe);

  // body
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 64), new THREE.MeshBasicMaterial({ color: 0x013117 })));
  // atmosphere rim
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.48,0.77,0.44, 1.0) * i; }',
    })
  );
  scene.add(rim);

  // graticule (survey grid)
  const grat = new THREE.Group();
  const gm = new THREE.LineBasicMaterial({ color: 0x3a9436, transparent: true, opacity: 0.16 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 4) pts.push(toVec(lat, lon, 1.001));
    grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 4) pts.push(toVec(lat, lon, 1.001));
    grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm));
  }
  globe.add(grat);

  // land dots
  const mask = landMask();
  const pos = [], col = [], size = [];
  const cOther = new THREE.Color('#2d6241'), cLat = new THREE.Color('#56a050'), cBr = new THREE.Color('#9fd98f');
  const step = innerWidth < 700 ? 1.5 : 1.1;
  for (let lat = -58; lat <= 78; lat += step) {
    const n = Math.max(1, Math.round((360 / step) * Math.cos((lat * Math.PI) / 180)));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (i / n) * 360;
      const v = mask(lat, lon);
      if (!v) continue;
      const p = toVec(lat, lon, 1.004);
      pos.push(p.x, p.y, p.z);
      const c = v > 200 ? cBr : v > 120 ? cLat : cOther;
      col.push(c.r, c.g, c.b);
      size.push(v > 200 ? 1.25 : v > 120 ? 1.05 : 0.85);
    }
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  dg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  dg.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uScale: { value: 1 } },
    vertexShader: `attribute float aSize; varying vec3 vC; varying float vF; uniform float uScale;
      void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0);
      vec3 n = normalize((modelMatrix*vec4(position,0.0)).xyz); vF = smoothstep(-0.15, 0.35, dot(n, normalize(cameraPosition)));
      gl_PointSize = aSize * uScale * (7.0 / -mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; varying float vF; void main(){ vec2 d = gl_PointCoord-0.5; if(dot(d,d)>0.25) discard; gl_FragColor = vec4(vC, vF); }`,
    vertexColors: true,
  });
  globe.add(new THREE.Points(dg, dotMat));

  // HQ marker
  const hqPos = toVec(HQ.lat, HQ.lon, 1.01);
  const hq = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf5b21f }));
  hq.position.copy(hqPos);
  globe.add(hq);
  const ringGeo = new THREE.RingGeometry(0.03, 0.036, 48);
  const rings = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xf5b21f, transparent: true, side: THREE.DoubleSide }));
    m.position.copy(toVec(HQ.lat, HQ.lon, 1.012));
    m.lookAt(new THREE.Vector3(0, 0, 0));
    m.userData.o = i / 3;
    globe.add(m);
    return m;
  });

  // arcs
  const arcMat = (delay) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uP: { value: 0 }, uC: { value: new THREE.Color('#f5b21f') } },
    vertexShader: 'varying float vT; void main(){ vT = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float uP; uniform vec3 uC; varying float vT;
      void main(){ if (vT > uP) discard; float head = smoothstep(uP-0.12, uP, vT); float a = 0.35 + 0.65*head; gl_FragColor = vec4(mix(vec3(0.48,0.77,0.44), uC, head), a); }`,
  });
  const arcs = DESTS.map((d, i) => {
    const a = toVec(HQ.lat, HQ.lon, 1), b = toVec(d.lat, d.lon, 1);
    const pts = [], ts = [];
    const N = 64;
    const dist = a.angleTo(b);
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const v = new THREE.Vector3().copy(a).lerp(b, t).normalize();
      v.multiplyScalar(1 + Math.sin(Math.PI * t) * (0.06 + dist * 0.28));
      pts.push(v); ts.push(t);
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.0045, 6, false);
    const line = new THREE.Mesh(g, arcMat(i));
    globe.add(line);
    const end = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), new THREE.MeshBasicMaterial({ color: 0x9fd98f, transparent: true, opacity: 0 }));
    end.position.copy(toVec(d.lat, d.lon, 1.008));
    globe.add(end);
    return { line, end, d };
  });

  // orientation: face South America
  const target = { y: 0, x: 0 };
  {
    const lonR = (HQ.lon * Math.PI) / 180;
    target.y = -lonR - Math.PI / 2 - 0.25;
    target.x = (-HQ.lat * Math.PI) / 180 * -0.55 - 0.15;
  }
  globe.rotation.set(target.x, target.y + 1.6, 0);
  rim.rotation.copy(globe.rotation);

  // drag
  const drag = { on: false, x: 0, y: 0, vy: 0, ox: 0, oy: 0 };
  let pointerId = null;
  box.tabIndex = 0;
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Globo interativo. Arraste horizontalmente ou use as setas do teclado para girar.');
  box.addEventListener('pointerdown', (e) => {
    if (pointerId !== null || e.button !== 0) return;
    pointerId = e.pointerId;
    drag.on = true; drag.vy = 0; drag.x = e.clientX; drag.y = e.clientY;
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag.on || e.pointerId !== pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.oy += dx * 0.006;
    if (e.pointerType === 'mouse') drag.ox = gsap.utils.clamp(-0.6, 0.6, drag.ox + dy * 0.004);
    drag.vy = ctx.reduce ? 0 : dx * 0.006;
  });
  const up = (e) => {
    if (e && 'pointerId' in e && e.pointerId !== pointerId) return;
    const id = pointerId;
    pointerId = null; drag.on = false;
    if (e?.type !== 'pointerup') drag.vy = 0;
    if (id !== null && box.hasPointerCapture(id)) box.releasePointerCapture(id);
  };
  box.addEventListener('pointerup', up);
  box.addEventListener('pointercancel', up);
  box.addEventListener('lostpointercapture', up);
  addEventListener('blur', up);
  box.addEventListener('keydown', (e) => {
    const changes = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (!changes[e.key]) return;
    e.preventDefault(); drag.oy += changes[e.key][0];
    drag.ox = gsap.utils.clamp(-0.6, 0.6, drag.ox + changes[e.key][1]);
  });

  function resize() {
    const r = box.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    dotMat.uniforms.uScale.value = r.width / 260;
  }
  new ResizeObserver(resize).observe(box);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);

  const chips = [...document.querySelectorAll('[data-dest]')];
  const intro = { spin: 1.6 };
  let launched = false;
  const launch = () => {
    if (launched) return;
    launched = true;
    gsap.to(intro, { spin: 0, duration: ctx.reduce ? 0 : 2.4, ease: 'expo.inOut' });
    arcs.forEach((a, i) => {
      gsap.to(a.line.material.uniforms.uP, {
        value: 1, duration: ctx.reduce ? 0 : 1.4, ease: 'power2.inOut', delay: ctx.reduce ? 0 : 1.6 + i * 0.22,
        onComplete: () => {
          gsap.to(a.end.material, { opacity: 1, duration: 0.4 });
          chips.find((c) => c.dataset.dest === a.d.name)?.classList.add('on');
        },
      });
    });
  };
  ScrollTrigger.create({ trigger: box, start: 'top 75%', once: true, onEnter: launch });

  const started = performance.now();
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = ctx.reduce ? 0 : (performance.now() - started) / 1000;
    if (!drag.on) { drag.oy += drag.vy; drag.vy *= 0.94; }
    const sway = ctx.reduce ? 0 : Math.sin(t * 0.25) * 0.08;
    globe.rotation.y = target.y + intro.spin + drag.oy + sway;
    globe.rotation.x = target.x + drag.ox;
    rings.forEach((m) => {
      const k = (t * 0.6 + m.userData.o) % 1;
      m.scale.setScalar(1 + k * 3.2);
      m.material.opacity = 1 - k;
    });
    renderer.render(scene, camera);
  })();
}
