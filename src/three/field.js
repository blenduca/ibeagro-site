import * as THREE from 'three';
import gsap from 'gsap';

// Hero v2 — "Lavoura de precisão".
// A planted field at dawn, in contour strips (soja · trigo · milho). The crop grows in on load,
// sways in the wind, and the cursor is a drone sensor: under it the plants switch to an
// NDVI-style vigour reading in the emblem colours. Scrolling lifts the camera like a drone.

const STRIPS = [
  // base, tip, height, width
  { name: 'Soja', base: '#1d5a2a', tip: '#56a050', h: 0.75, w: 0.11 },
  { name: 'Trigo', base: '#6f7a24', tip: '#f5b21f', h: 1.15, w: 0.07 },
  { name: 'Milho', base: '#0f522d', tip: '#3a9436', h: 1.9, w: 0.13 },
];

const vigour = (x, z) => 0.5 + 0.5 * Math.sin(x * 0.11 + Math.cos(z * 0.07) * 2.0) * Math.cos(z * 0.09 - x * 0.03);
const rowCurve = (x) => Math.sin(x * 0.045) * 5.0 + Math.sin(x * 0.013 + 1.3) * 7.0;

export default function initField(ctx) {
  const host = document.querySelector('[data-terrain]');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'terrain';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return;
  }
  host.prepend(canvas);
  host.querySelector('.hero-fallback')?.remove();
  const small = innerWidth < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(small ? 62 : 44, 1, 0.1, 600);

  const horizon = new THREE.Color('#5b5a1a');
  const sunDir = new THREE.Vector3(0.35, 0.05, -1).normalize();
  const shared = {
    uTime: { value: 0 },
    uGrow: { value: 0 },
    uProbe: { value: new THREE.Vector3(0, 0, -999) },
    uProbeOn: { value: 0 },
    uProbeR: { value: small ? 5 : 6.5 },
    uHorizon: { value: horizon },
    uFogNear: { value: 55 },
    uFogFar: { value: 150 },
  };

  /* ── Sky: dawn over the field ── */
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(400, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uSun: { value: sunDir }, uTop: { value: new THREE.Color('#02240f') }, uHor: { value: horizon }, uGold: { value: new THREE.Color('#f5b21f') } },
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `uniform vec3 uSun, uTop, uHor, uGold; varying vec3 vD;
          void main(){
            float y = max(vD.y, 0.0);
            vec3 c = mix(uHor, uTop, smoothstep(0.0, 0.32, y));
            float s = max(dot(vD, uSun), 0.0);
            c += uGold * pow(s, 18.0) * 0.55 * (1.0 - smoothstep(0.0, 0.25, y));
            c = mix(c, uGold, smoothstep(0.9975, 0.999, s));
            gl_FragColor = vec4(c, 1.0);
          }`,
      })
    )
  );

  /* ── Ground: soil with contour furrows + drone survey disc ── */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400, 1, 1).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: { ...shared, uSoil: { value: new THREE.Color('#0b2312') }, uLine: { value: new THREE.Color('#2d6241') }, uGold: { value: new THREE.Color('#f5b21f') } },
      vertexShader: 'varying vec3 vW; varying float vFog; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vFog = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: `uniform vec3 uSoil, uLine, uGold, uHorizon, uProbe; uniform float uProbeOn, uProbeR, uFogNear, uFogFar, uTime;
        varying vec3 vW; varying float vFog;
        float line(float v, float w){ float d = fwidth(v); return 1.0 - smoothstep(w - 0.5, w + 0.5, abs(fract(v - 0.5) - 0.5) / d); }
        void main(){
          float curve = sin(vW.x * 0.045) * 5.0 + sin(vW.x * 0.013 + 1.3) * 7.0;
          float rows = line((vW.z - curve) / 0.9, 1.0);
          vec3 c = mix(uSoil, uLine, rows * 0.35);
          float d = distance(vW.xz, uProbe.xz);
          float inside = (1.0 - smoothstep(uProbeR - 0.15, uProbeR, d)) * uProbeOn;
          float ring = line(d / uProbeR, 1.4) * step(d, uProbeR * 1.05) * uProbeOn;
          float grid = (line(vW.x, 0.8) + line(vW.z, 0.8)) * inside * 0.5;
          float sweep = smoothstep(0.0, 0.25, fract(atan(vW.z - uProbe.z, vW.x - uProbe.x) / 6.2832 - uTime * 0.35)) ;
          c = mix(c, uGold, ring * 0.9 + grid * 0.35 + inside * (1.0 - sweep) * 0.12);
          gl_FragColor = vec4(mix(c, uHorizon, smoothstep(uFogNear, uFogFar, vFog)), 1.0);
        }`,
      extensions: { derivatives: true },
    })
  );
  scene.add(ground);

  /* ── Crops: one instanced blade per plant ── */
  const blade = new THREE.PlaneGeometry(1, 1, 1, 5);
  blade.translate(0, 0.5, 0);
  {
    const p = blade.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - p.getY(i) * 0.92));
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = blade.index;
  geo.setAttribute('position', blade.attributes.position);

  const offs = [], hs = [], ws = [], rots = [], types = [], rands = [], vig = [];
  const spacing = small ? 0.42 : 0.3;
  const X = small ? 34 : 64;
  for (let r = -110; r <= 13; r++) {
    const rz = r * 0.9;
    const band = ((Math.floor(r / 9) % 3) + 3) % 3;
    const S = STRIPS[band];
    for (let x = -X; x <= X; x += spacing * (0.8 + Math.random() * 0.4)) {
      const z = rz + rowCurve(x) + (Math.random() - 0.5) * 0.18;
      // fade density with distance to keep the far field cheap
      if (z < -60 && Math.random() < 0.45) continue;
      const v = vigour(x, z);
      offs.push(x, 0, z);
      hs.push(S.h * (0.7 + v * 0.45) * (0.85 + Math.random() * 0.3));
      ws.push(S.w * (0.8 + Math.random() * 0.4));
      rots.push(Math.random() * Math.PI);
      types.push(band);
      rands.push(Math.random());
      vig.push(v);
    }
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(offs), 3));
  geo.setAttribute('aH', new THREE.InstancedBufferAttribute(new Float32Array(hs), 1));
  geo.setAttribute('aW', new THREE.InstancedBufferAttribute(new Float32Array(ws), 1));
  geo.setAttribute('aRot', new THREE.InstancedBufferAttribute(new Float32Array(rots), 1));
  geo.setAttribute('aType', new THREE.InstancedBufferAttribute(new Float32Array(types), 1));
  geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(new Float32Array(rands), 1));
  geo.setAttribute('aVig', new THREE.InstancedBufferAttribute(new Float32Array(vig), 1));
  geo.instanceCount = hs.length;

  const cropMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      ...shared,
      uBase: { value: STRIPS.map((s) => new THREE.Color(s.base)) },
      uTip: { value: STRIPS.map((s) => new THREE.Color(s.tip)) },
      uLow: { value: new THREE.Color('#d44e23') },
      uMid: { value: new THREE.Color('#f5b21f') },
      uHigh: { value: new THREE.Color('#9fe08a') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uGrow, uProbeOn, uProbeR;
      uniform vec3 uProbe;
      attribute vec3 aOffset;
      attribute float aH, aW, aRot, aType, aRand, aVig;
      varying float vY, vType, vScan, vFog, vVig, vEdge;
      void main(){
        vec3 p = position;
        float d0 = length(aOffset.xz - vec2(0.0, 8.0));
        float g = clamp((uGrow * 150.0 - d0) / 14.0, 0.0, 1.0);
        g = g * g * (3.0 - 2.0 * g);
        float h = aH * g;
        p.x *= aW;
        p.y *= h;
        float c = cos(aRot), s = sin(aRot);
        p.xz = mat2(c, -s, s, c) * p.xz;
        vec3 w = aOffset + p;
        float bend = position.y * position.y;
        float gust = sin(uTime * 0.6 + aOffset.x * 0.04 - aOffset.z * 0.02) * 0.5 + 0.5;
        float sway = sin(uTime * 1.7 + aOffset.x * 0.3 + aOffset.z * 0.2 + aRand * 6.2831) * (0.08 + gust * 0.22);
        w.x += sway * bend * h;
        w.z += sway * 0.4 * bend * h;
        vec2 dv = w.xz - uProbe.xz;
        float dd = length(dv);
        float push = uProbeOn * (1.0 - smoothstep(0.0, uProbeR * 0.8, dd));
        w.xz += normalize(dv + 1e-4) * push * 0.9 * bend * h;
        w.y -= push * 0.25 * bend * h;
        vY = position.y;
        vType = aType;
        vVig = aVig;
        vScan = (1.0 - smoothstep(uProbeR - 0.4, uProbeR, dd)) * uProbeOn;
        vEdge = (1.0 - smoothstep(0.0, 0.5, abs(dd - uProbeR))) * uProbeOn;
        vec4 mv = viewMatrix * vec4(w, 1.0);
        vFog = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase[3], uTip[3], uLow, uMid, uHigh, uHorizon;
      uniform float uFogNear, uFogFar;
      varying float vY, vType, vScan, vFog, vVig, vEdge;
      void main(){
        int t = int(vType + 0.5);
        vec3 base = t == 0 ? uBase[0] : t == 1 ? uBase[1] : uBase[2];
        vec3 tip = t == 0 ? uTip[0] : t == 1 ? uTip[1] : uTip[2];
        vec3 col = mix(base, tip, smoothstep(0.15, 1.0, vY));
        col *= 0.5 + 0.7 * vY; // self-shadow at the root, light at the tip
        col += vec3(0.35, 0.24, 0.04) * pow(vY, 3.0) * 0.6; // dawn backlight on the tips
        // NDVI-style vigour reading under the drone
        vec3 ndvi = vVig < 0.5 ? mix(uLow, uMid, vVig * 2.0) : mix(uMid, uHigh, (vVig - 0.5) * 2.0);
        col = mix(col, ndvi * (0.6 + 0.6 * vY), vScan);
        col = mix(col, vec3(1.0, 0.85, 0.4), vEdge * 0.6);
        col = mix(col, uHorizon, smoothstep(uFogNear, uFogFar, vFog));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const crops = new THREE.Mesh(geo, cropMat);
  crops.frustumCulled = false;
  scene.add(crops);

  /* ── Pollen / seeds drifting in the dawn light ── */
  const NP = small ? 260 : 600;
  const pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - 0.5) * 70; pp[i * 3 + 1] = Math.random() * 9; pp[i * 3 + 2] = -Math.random() * 70 + 15; }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pollen = new THREE.Points(pg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: shared.uTime },
    vertexShader: `uniform float uTime; varying float vA;
      void main(){ vec3 p = position; p.y = mod(p.y + uTime * 0.25, 9.0); p.x += sin(uTime * 0.4 + position.z) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = smoothstep(0.0, 1.5, p.y) * (1.0 - smoothstep(6.0, 9.0, p.y));
        gl_PointSize = 26.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.96, 0.7, 0.12, (1.0 - d * 2.0) * 0.55 * vA); }`,
  }));
  scene.add(pollen);

  /* ── Drone sensor ── */
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
  const hit = new THREE.Vector3();
  const hud = document.querySelector('[data-hud-alt]');
  const hudPos = document.querySelector('[data-hud-pos]');
  const hudLbl = host.querySelector('.hud-r span');
  if (hudLbl) hudLbl.textContent = 'Vigor da lavoura · NDVI';
  if (hud) hud.textContent = '—';
  let inside = false;
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    inside = true;
  });
  host.addEventListener('pointerleave', () => (inside = false));
  // touch: the drone flies on its own until the visitor touches the field
  let autoPilot = !ctx.finePointer;

  const state = { scroll: 0, cx: 0, cy: 0 };
  if (!ctx.reduce) {
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      ScrollTrigger.create({ trigger: host, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (st) => (state.scroll = st.progress) });
    });
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  gsap.to(shared.uGrow, { value: 1, duration: ctx.reduce ? 0 : 3.4, ease: 'power2.out', delay: ctx.reduce ? 0 : 0.3 });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);

  const clock = new THREE.Clock();
  let frame = 0;
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    shared.uTime.value = ctx.reduce ? 0 : t;
    const mx = inside ? ndc.x : 0, my = inside ? ndc.y : 0;
    state.cx += (mx - state.cx) * 0.04;
    state.cy += (my - state.cy) * 0.04;
    const s = state.scroll;
    // ground level → drone altitude as the visitor scrolls
    camera.position.set(state.cx * 2.5, 6.5 + s * 28 + state.cy * 0.8, 21 - s * 12);
    camera.lookAt(state.cx * 4, -1.5 - s * 6, -26 - s * 4);

    let probeOn = 0;
    if (inside || autoPilot) {
      if (autoPilot && !inside) ndc.set(Math.sin(t * 0.35) * 0.45, -0.35 + Math.sin(t * 0.21) * 0.12);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit) && hit.z > -110) {
        shared.uProbe.value.lerp(hit, frame < 2 ? 1 : 0.25);
        probeOn = 1;
        if (frame % 6 === 0) {
          const p = shared.uProbe.value;
          if (hud) hud.textContent = (0.32 + vigour(p.x, p.z) * 0.6).toFixed(2);
          if (hudPos) hudPos.textContent = `${(27.1004 + p.z * 0.0009).toFixed(4)}°S ${(52.6152 - p.x * 0.0009).toFixed(4)}°W`;
        }
      }
    }
    shared.uProbeOn.value += (probeOn - shared.uProbeOn.value) * 0.08;
    frame++;
    renderer.render(scene, camera);
  })();
  host.addEventListener('pointerdown', () => (autoPilot = false), { once: true });

}
