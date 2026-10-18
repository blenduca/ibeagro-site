import * as THREE from 'three';
import { feature } from 'topojson-client';
import { geoPath, geoMercator } from 'd3-geo';
import countries from 'world-atlas/countries-110m.json';

// Hero v3 — "Grãos".
// Thousands of grains flow like a harvest stream and settle into the institute's story:
// a planted field → Brazil (Chapecó in gold) → the open book of the emblem → a sprout.
// The cursor scatters the grains; scrolling releases them into the air.

const SHAPES = ['Lavoura', 'Brasil', 'Conhecimento', 'Futuro'];

function samplePixels(draw, n, size = 420, scale = 9) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.fillRect(0, 0, size, size);
  draw(g, size);
  const d = g.getImageData(0, 0, size, size).data;
  const pts = [];
  for (let y = 0; y < size; y += 2) for (let x = 0; x < size; x += 2) {
    const i = (y * size + x) * 4;
    if (d[i] > 40 || d[i + 1] > 40) pts.push([x, y, d[i] > 200 && d[i + 1] < 120 ? 1 : 0]);
  }
  const out = new Float32Array(n * 3), flag = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const p = pts[(Math.random() * pts.length) | 0];
    out[k * 3] = ((p[0] + Math.random() * 2) / size - 0.5) * scale;
    out[k * 3 + 1] = -((p[1] + Math.random() * 2) / size - 0.5) * scale;
    out[k * 3 + 2] = (Math.random() - 0.5) * 0.35;
    flag[k] = p[2];
  }
  return { pos: out, flag };
}

function fieldShape(n) {
  // contour-planted rows seen from a drone, alternating crop strips
  const pos = new Float32Array(n * 3), flag = new Float32Array(n);
  const ROWS = 18;
  for (let k = 0; k < n; k++) {
    const row = Math.floor(Math.random() * ROWS);
    const x = (Math.random() - 0.5) * 10.5;
    const y = (row - ROWS / 2) * 0.46 + Math.sin(x * 0.45 + row * 0.08) * 0.7 + (Math.random() - 0.5) * 0.07;
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = (Math.random() - 0.5) * 0.3;
    flag[k] = Math.floor(row / 3) % 2;
  }
  return { pos, flag };
}

function brazilShape(n) {
  const fc = feature(countries, countries.objects.countries);
  const br = fc.features.find((f) => f.id === '076');
  return samplePixels((g, s) => {
    const proj = geoMercator().fitExtent([[30, 30], [s - 30, s - 30]], br);
    const path = geoPath(proj, g);
    g.beginPath(); path(br); g.fillStyle = '#3fa040'; g.fill();
    const [cx, cy] = proj([-52.6152, -27.1004]);
    g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fillStyle = '#ff3000'; g.fill();
  }, n, 420, 8.5);
}

function bookShape(n) {
  return samplePixels((g, s) => {
    g.fillStyle = '#3fa040';
    const page = (dir) => {
      g.beginPath();
      g.moveTo(s / 2, s * 0.78);
      g.bezierCurveTo(s / 2 + dir * s * 0.12, s * 0.62, s / 2 + dir * s * 0.3, s * 0.6, s / 2 + dir * s * 0.46, s * 0.66);
      g.lineTo(s / 2 + dir * s * 0.46, s * 0.4);
      g.bezierCurveTo(s / 2 + dir * s * 0.3, s * 0.33, s / 2 + dir * s * 0.12, s * 0.36, s / 2, s * 0.5);
      g.closePath();
      g.fill();
    };
    page(-1); page(1);
    // lines of text on each page
    g.strokeStyle = '#000'; g.lineWidth = 5;
    for (let i = 0; i < 5; i++) for (const dir of [-1, 1]) {
      g.beginPath();
      const y = s * (0.47 + i * 0.05);
      g.moveTo(s / 2 + dir * s * 0.07, y + 6);
      g.quadraticCurveTo(s / 2 + dir * s * 0.22, y - 8, s / 2 + dir * s * 0.4, y - 2);
      g.stroke();
    }
    // knowledge spark (gold) rising from the spine
    g.fillStyle = '#ff3000';
    g.beginPath(); g.arc(s / 2, s * 0.28, 16, 0, Math.PI * 2); g.fill();
  }, n, 420, 9.5);
}

function sproutShape(n) {
  return samplePixels((g, s) => {
    g.fillStyle = '#3fa040';
    g.fillRect(s / 2 - 5, s * 0.42, 10, s * 0.42);
    const leaf = (dir, y, len) => {
      g.beginPath();
      g.moveTo(s / 2, y);
      g.bezierCurveTo(s / 2 + dir * len * 0.3, y - len * 0.55, s / 2 + dir * len * 0.85, y - len * 0.5, s / 2 + dir * len, y - len * 0.85);
      g.bezierCurveTo(s / 2 + dir * len * 0.6, y - len * 0.1, s / 2 + dir * len * 0.2, y + len * 0.05, s / 2, y);
      g.fill();
    };
    leaf(-1, s * 0.6, s * 0.34);
    leaf(1, s * 0.48, s * 0.32);
    // soil line
    g.fillRect(s * 0.15, s * 0.84, s * 0.7, 8);
    g.fillStyle = '#ff3000';
    for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(s / 2 + (i % 2 ? 9 : -9), s * 0.4 - i * 13, 8, 12, i % 2 ? 0.4 : -0.4, 0, Math.PI * 2); g.fill(); }
  }, n, 420, 9.5);
}

export default function initGrains(ctx) {
  const host = document.querySelector('[data-terrain]');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'terrain';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch { return; }
  host.prepend(canvas);
  host.querySelector('.hero-fallback')?.remove();
  const small = innerWidth < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x02240f, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const N = small ? 7000 : 16000;
  const targets = [fieldShape(N), brazilShape(N), bookShape(N), sproutShape(N)];

  const geo = new THREE.BufferGeometry();
  const scatter = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { scatter[i * 3] = (Math.random() - 0.5) * 30; scatter[i * 3 + 1] = (Math.random() - 0.5) * 18; scatter[i * 3 + 2] = (Math.random() - 0.5) * 10; }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(targets[0].pos), 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(new Float32Array(scatter), 3));
  geo.setAttribute('aTo', new THREE.BufferAttribute(new Float32Array(targets[0].pos), 3));
  geo.setAttribute('aFlagFrom', new THREE.BufferAttribute(new Float32Array(N), 1));
  geo.setAttribute('aFlagTo', new THREE.BufferAttribute(new Float32Array(targets[0].flag), 1));
  const rnd = new Float32Array(N); for (let i = 0; i < N; i++) rnd[i] = Math.random();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const scat = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) scat[i] = (Math.random() - 0.5) * 2;
  geo.setAttribute('aScatter', new THREE.BufferAttribute(scat, 3));

  const uniforms = {
    uMix: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(99, 99, 0) },
    uScroll: { value: 0 },
    uSize: { value: 1 },
    uShift: { value: new THREE.Vector2(0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uMix, uTime, uScroll, uSize;
      uniform vec3 uMouse;
      uniform vec2 uShift;
      attribute vec3 aFrom, aTo, aScatter;
      attribute float aRand, aFlagFrom, aFlagTo;
      varying float vFlag, vRand, vGlow;
      void main(){
        // each grain leaves on its own delay: a stream, not a jump-cut
        float m = clamp((uMix * 1.6 - aRand * 0.6), 0.0, 1.0);
        m = m * m * (3.0 - 2.0 * m);
        vec3 p = mix(aFrom, aTo, m);
        float arc = sin(m * 3.14159);
        p += vec3(sin(aRand * 40.0 + uTime) * 1.2, 1.4 + cos(aRand * 30.0) * 0.8, sin(aRand * 17.0) * 1.5) * arc;
        // breathing
        p += aScatter * 0.03 * sin(uTime * 1.3 + aRand * 20.0);
        p.xy += uShift;
        // cursor scatters the grains
        vec2 d = p.xy - uMouse.xy;
        float r = length(d);
        float f = smoothstep(2.2, 0.0, r);
        p.xy += normalize(d + 1e-4) * f * 1.4;
        p.z += f * 1.5;
        vGlow = f;
        // scroll releases grains upward into the air
        p += aScatter * uScroll * 6.0 + vec3(0.0, uScroll * 4.0 * aRand, 0.0);
        vFlag = mix(aFlagFrom, aFlagTo, step(0.5, m));
        vRand = aRand;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (2.2 + aRand * 2.2) * (16.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vFlag, vRand, vGlow;
      void main(){
        vec2 q = gl_PointCoord - 0.5;
        q.x *= 1.35; // grains are slightly oval
        float d = length(q);
        if (d > 0.5) discard;
        vec3 gold = mix(vec3(0.96, 0.70, 0.12), vec3(0.98, 0.89, 0.65), vRand * 0.6);
        vec3 green = mix(vec3(0.23, 0.58, 0.21), vec3(0.49, 0.77, 0.44), vRand);
        vec3 c = vFlag > 0.5 ? gold : (vRand > 0.82 ? gold : green);
        c *= 0.75 + 0.5 * (0.5 - d);
        c = mix(c, vec3(1.0, 0.9, 0.55), vGlow * 0.6);
        gl_FragColor = vec4(c, smoothstep(0.5, 0.3, d));
      }`,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const hudLbl = host.querySelector('.hud-r span');
  const hud = document.querySelector('[data-hud-alt]');
  if (hudLbl) hudLbl.textContent = 'Grãos em movimento';
  if (hud) hud.textContent = SHAPES[0];

  let current = 0;
  const fromA = geo.attributes.aFrom, toA = geo.attributes.aTo, fF = geo.attributes.aFlagFrom, fT = geo.attributes.aFlagTo;
  function goTo(idx) {
    // freeze the current visual target as the new origin
    fromA.array.set(toA.array);
    fF.array.set(fT.array);
    toA.array.set(targets[idx].pos);
    fT.array.set(targets[idx].flag);
    fromA.needsUpdate = toA.needsUpdate = fF.needsUpdate = fT.needsUpdate = true;
    uniforms.uMix.value = 0;
    current = idx;
    if (hud) hud.textContent = SHAPES[idx];
  }
  // first assembly from the scattered cloud
  uniforms.uMix.value = 0;

  const mouse = new THREE.Vector2(9, 9), mWorld = new THREE.Vector3();
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  host.addEventListener('pointerleave', () => mouse.set(9, 9));
  host.addEventListener('click', (e) => { if (!e.target.closest('a, button')) goTo((current + 1) % targets.length); });

  let scroll = 0;
  if (!ctx.reduce) import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => ScrollTrigger.create({ trigger: host, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (st) => (scroll = st.progress) }));

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 900;
    uniforms.uShift.value.set(wide ? 4.2 : 0, wide ? 0.6 : 3.6);
    camera.position.z = wide ? 16 : 23;
    uniforms.uSize.value = (h / 900) * renderer.getPixelRatio();
  }
  resize();
  addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);
  const clock = new THREE.Clock();
  let last = 0, hold = 0;
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last); last = t;
    uniforms.uTime.value = ctx.reduce ? 0 : t;
    if (uniforms.uMix.value < 1) uniforms.uMix.value = Math.min(1, uniforms.uMix.value + dt * (ctx.reduce ? 10 : 0.42));
    else if (!ctx.reduce) { hold += dt; if (hold > 3.2) { hold = 0; goTo((current + 1) % targets.length); } }
    uniforms.uScroll.value += (scroll - uniforms.uScroll.value) * 0.1;
    // cursor in world space at z = 0
    const v = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera).sub(camera.position).normalize();
    mWorld.copy(camera.position).add(v.multiplyScalar(-camera.position.z / v.z));
    uniforms.uMouse.value.set(mWorld.x, mWorld.y, 0);
    points.rotation.y = Math.sin(t * 0.2) * 0.12 + mouse.x * 0.05 * (mouse.x < 2 ? 1 : 0);
    renderer.render(scene, camera);
  })();
}
