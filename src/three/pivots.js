import * as THREE from 'three';

// Hero v4 — "Pivôs".
// Satellite view over farmland: plots in different crops, centre pivots sweeping irrigation,
// aviaries, pasture with cattle, a riparian forest. Hovering a plot "surveys" it (gold outline +
// data tag). Scrolling zooms the satellite out.

const TYPES = ['Soja', 'Milho', 'Trigo', 'Pastagem', 'Pivô central', 'Aviários'];
const ROT = 0.18;

// Same hash as the shader (Dave Hoskins hash12), done in 32-bit floats.
const f32 = Math.fround;
const fract = (x) => f32(x - Math.floor(x));
function hash12(x, y) {
  let a = fract(f32(x * 0.1031)), b = fract(f32(y * 0.1031)), c = fract(f32(x * 0.1031));
  const d = f32(a * f32(b + 33.33) + b * f32(c + 33.33) + c * f32(a + 33.33));
  a = f32(a + d); b = f32(b + d); c = f32(c + d);
  return fract(f32(f32(a + b) * c));
}
function cellType(h) {
  if (h < 0.24) return 4;
  if (h < 0.34) return 5;
  if (h < 0.52) return 0;
  if (h < 0.68) return 1;
  if (h < 0.82) return 2;
  return 3;
}

export default function initPivots(ctx) {
  const host = document.querySelector('[data-terrain]');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'terrain';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); } catch { return; }
  host.prepend(canvas);
  host.querySelector('.hero-fallback')?.remove();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uZoom: { value: 3.2 },
    uPan: { value: new THREE.Vector2(0.3, 0.2) },
    uHover: { value: new THREE.Vector2(9999, 9999) },
    uHoverOn: { value: 0 },
    uReveal: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec2 uRes, uPan, uHover;
      uniform float uTime, uZoom, uHoverOn, uReveal;
      float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }
      mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
      const vec3 SOJA = vec3(0.227, 0.580, 0.212);
      const vec3 MILHO = vec3(0.059, 0.322, 0.176);
      const vec3 TRIGO = vec3(0.86, 0.66, 0.15);
      const vec3 PASTO = vec3(0.34, 0.63, 0.31);
      const vec3 SOLO = vec3(0.30, 0.26, 0.16);
      const vec3 ROAD = vec3(0.62, 0.58, 0.45);
      const vec3 GOLD = vec3(0.96, 0.70, 0.12);
      vec3 crop(int t, vec2 f, float h, float rowsDir){
        float rows = sin((rowsDir > 0.5 ? f.x : f.y) * 160.0) * 0.5 + 0.5;
        float n = noise(f * 9.0 + h * 50.0);
        if (t == 0) return SOJA * (0.85 + 0.15 * rows) * (0.85 + 0.3 * n);
        if (t == 1) return MILHO * (0.8 + 0.35 * rows) * (0.9 + 0.3 * n);
        if (t == 2) return TRIGO * (0.86 + 0.12 * rows) * (0.85 + 0.25 * n);
        return PASTO * (0.75 + 0.45 * n);
      }
      void main(){
        vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
        vec2 p = rot(${ROT.toFixed(2)}) * (uv * uZoom + uPan);
        vec2 id = floor(p), f = fract(p);
        float h = hash12(id), h2 = hash12(id + 17.0), h3 = hash12(id + 41.0);
        int t = h < 0.24 ? 4 : h < 0.34 ? 5 : h < 0.52 ? 0 : h < 0.68 ? 1 : h < 0.82 ? 2 : 3;
        vec3 col;
        if (t == 4) {
          // centre pivot
          vec2 c = f - 0.5; float r = length(c);
          float ang = atan(c.y, c.x);
          vec3 corner = mix(SOLO, PASTO * 0.8, step(0.5, h2)) * (0.85 + 0.3 * noise(f * 12.0 + h * 9.0));
          float arm = uTime * (0.18 + h2 * 0.12) + h * 6.2831;
          float diff = mod(arm - ang, 6.2831);
          float wet = exp(-diff * 0.9);
          vec3 inside = mix(SOJA, MILHO, step(0.5, h3)) * (0.8 + 0.25 * (sin(r * 220.0) * 0.5 + 0.5));
          inside = mix(inside * 0.85, inside * 1.25 + vec3(0.02, 0.06, 0.04), wet);
          col = mix(inside, corner, smoothstep(0.455, 0.465, r));
          float armLine = (1.0 - smoothstep(0.004, 0.012, abs(sin(diff) * r))) * step(cos(diff), 0.0) * 0.0;
          float armLine2 = (1.0 - smoothstep(0.003, 0.009, abs(diff < 3.1416 ? diff : 6.2831 - diff) * r)) * step(r, 0.46);
          col = mix(col, vec3(0.88, 0.92, 0.86), armLine2);
          col = mix(col, vec3(0.9), (1.0 - smoothstep(0.012, 0.02, r)));
        } else if (t == 5) {
          // aviaries: long sheds in a row
          col = PASTO * (0.7 + 0.4 * noise(f * 10.0 + h));
          vec2 q = f - vec2(0.5);
          for (int k = 0; k < 4; k++) {
            float y = -0.3 + float(k) * 0.2;
            float shed = step(abs(q.x), 0.36) * step(abs(q.y - y), 0.045);
            col = mix(col, mix(vec3(0.89, 0.93, 0.89), vec3(0.95, 0.75, 0.25), step(0.0, q.y - y)) , shed);
          }
        } else {
          // split the plot in two fields with different crops
          float split = 0.35 + h2 * 0.3;
          bool second = (h3 > 0.5 ? f.x : f.y) > split;
          int t2 = second ? int(mod(float(t) + 1.0 + floor(h3 * 2.0), 4.0)) : t;
          col = crop(t2, f, h, h3);
          float seam = 1.0 - smoothstep(0.0, 0.006, abs((h3 > 0.5 ? f.x : f.y) - split));
          col = mix(col, ROAD * 0.8, seam * 0.6);
          if (t2 == 3) {
            // cattle grazing
            for (int k = 0; k < 6; k++) {
              vec2 cp = vec2(hash12(id + float(k)), hash12(id + float(k) + 7.0));
              cp += vec2(sin(uTime * 0.08 + float(k)), cos(uTime * 0.07 + float(k) * 2.0)) * 0.04;
              col = mix(col, vec3(0.95, 0.94, 0.9), 1.0 - smoothstep(0.006, 0.01, length(f - cp)));
            }
          }
        }
        // roads between plots
        float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        col = mix(ROAD, col, smoothstep(0.012, 0.02, edge));
        // riparian forest following a creek
        vec2 wp = rot(-${ROT.toFixed(2)}) * p;
        float creek = abs(wp.y - sin(wp.x * 0.55) * 1.4 - 0.6 * sin(wp.x * 1.3 + 2.0));
        float forest = 1.0 - smoothstep(0.1, 0.16, creek + (noise(wp * 14.0) - 0.5) * 0.05);
        col = mix(col, vec3(0.02, 0.2, 0.09) * (0.7 + 0.6 * noise(wp * 30.0)), forest);
        col = mix(col, vec3(0.12, 0.28, 0.34), 1.0 - smoothstep(0.012, 0.022, creek));
        // survey highlight
        float hov = step(length(id - uHover), 0.1) * uHoverOn;
        float ring = (1.0 - smoothstep(0.018, 0.03, edge)) * hov;
        col = mix(col, col * 1.18 + vec3(0.03), hov * 0.6);
        col = mix(col, GOLD, ring);
        // dim + tint into the brand green (night-satellite feel) and reveal scan from the left
        col = mix(vec3(0.008, 0.14, 0.06), col * 0.9, 0.62);
        float scan = smoothstep(uReveal * 2.6 - 1.3 - 0.05, uReveal * 2.6 - 1.3, uv.x);
        col = mix(col, vec3(0.008, 0.14, 0.06), scan);
        col += GOLD * (1.0 - smoothstep(0.0, 0.006, abs(uv.x - (uReveal * 2.6 - 1.3)))) * (1.0 - step(1.0, uReveal)) * 0.8;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  // data tag
  const tag = document.createElement('div');
  tag.className = 'plot-tag coord';
  tag.setAttribute('aria-hidden', 'true');
  host.appendChild(tag);
  const hudLbl = host.querySelector('.hud-r span');
  const hud = document.querySelector('[data-hud-alt]');
  if (hudLbl) hudLbl.textContent = 'Talhão em análise';
  if (hud) hud.textContent = '—';

  const state = { mx: 0, my: 0, tx: 0, ty: 0, inside: false, auto: !ctx.finePointer, scroll: 0, px: 0, py: 0 };
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    state.px = e.clientX - r.left; state.py = e.clientY - r.top;
    state.inside = true;
  });
  host.addEventListener('pointerleave', () => (state.inside = false));
  host.addEventListener('pointerdown', () => (state.auto = false), { once: true });
  if (!ctx.reduce) import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => ScrollTrigger.create({ trigger: host, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (st) => (state.scroll = st.progress) }));

  function resize() {
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    const b = renderer.getDrawingBufferSize(new THREE.Vector2());
    uniforms.uRes.value.copy(b);
  }
  resize();
  addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);
  const clock = new THREE.Clock();
  let lastId = '';
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = ctx.reduce ? 40 : t;
    uniforms.uReveal.value = ctx.reduce ? 1 : Math.min(1, t / 2.2);
    const w = host.clientWidth, hgt = host.clientHeight;
    if (state.auto && !state.inside) {
      state.px = w * (0.62 + Math.sin(t * 0.23) * 0.2);
      state.py = hgt * (0.38 + Math.cos(t * 0.17) * 0.15);
    }
    const nx = state.px / w - 0.5, ny = state.py / hgt - 0.5;
    state.tx += (nx - state.tx) * 0.03; state.ty += (ny - state.ty) * 0.03;
    // slow satellite drift + parallax; scroll zooms out
    uniforms.uZoom.value = (w < 900 ? 4.2 : 4.6) * (1 + state.scroll * 0.9);
    uniforms.uPan.value.set(0.3 + t * 0.012 + state.tx * 0.25, 0.2 + t * 0.006 - state.ty * 0.25);

    // which plot is under the pointer (same transform as the shader)
    const show = state.inside || state.auto;
    if (show) {
      const ux = (state.px - w / 2) / hgt, uy = (hgt / 2 - state.py) / hgt;
      const z = uniforms.uZoom.value, pan = uniforms.uPan.value;
      const qx = ux * z + pan.x, qy = uy * z + pan.y;
      const c = Math.cos(ROT), s = Math.sin(ROT);
      const px = c * qx + s * qy, py = -s * qx + c * qy; // GLSL mat2 is column-major
      const ix = Math.floor(px), iy = Math.floor(py);
      uniforms.uHover.value.set(ix, iy);
      const id = ix + ':' + iy;
      if (id !== lastId) {
        lastId = id;
        const h = hash12(ix, iy);
        const type = TYPES[cellType(h)];
        const ha = Math.round(18 + hash12(ix + 5, iy + 9) * 90);
        const ndvi = (0.45 + hash12(ix + 3, iy + 1) * 0.45).toFixed(2);
        tag.innerHTML = `<b>Talhão ${String(Math.abs(ix * 37 + iy * 11) % 900).padStart(3, '0')}</b><span>${type} · ${ha} ha</span><span>NDVI ${ndvi}</span>`;
        if (hud) hud.textContent = `${type} · ${ha} ha`;
      }
      tag.style.transform = `translate(${Math.min(state.px + 18, w - tag.offsetWidth - 10)}px, ${Math.min(state.py + 18, hgt - tag.offsetHeight - 10)}px)`;
    }
    uniforms.uHoverOn.value += ((show ? 1 : 0) - uniforms.uHoverOn.value) * 0.1;
    tag.style.opacity = String(uniforms.uHoverOn.value);
    renderer.render(scene, camera);
  })();
}
