import * as THREE from 'three';
import gsap from 'gsap';

// Live topographic relief: the field is drawn only by its contour lines.
// Mouse = survey probe (gold isolines + elevation readout). Scroll = camera glides over the land.

// JS twin of the GLSL height field (static), used to build geometry and probe the surface.
const G2 = (3 - Math.sqrt(3)) / 6;
const perm = new Uint8Array(512);
(() => { let seed = 1307; const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { seed = (seed * 16807) % 2147483647; const j = seed % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
function snoise(x, y) {
  const s = (x + y) * 0.5 * (Math.sqrt(3) - 1);
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let n = 0;
  for (const [dx, dy, gi] of [[x0, y0, perm[ii + perm[jj]]], [x1, y1, perm[ii + i1 + perm[jj + j1]]], [x2, y2, perm[ii + 1 + perm[jj + 1]]]]) {
    let tt = 0.5 - dx * dx - dy * dy;
    if (tt > 0) { tt *= tt; const g = grad[gi & 7]; n += tt * tt * (g[0] * dx + g[1] * dy); }
  }
  return 70 * n;
}
function fbm(x, y) { let f = 0, a = 0.5; for (let i = 0; i < 5; i++) { f += a * snoise(x, y); x *= 2.02; y *= 2.02; a *= 0.5; } return f; }
export function heightAt(x, z) {
  let h = fbm(x * 0.085, z * 0.085);
  h += 0.35 * snoise(x * 0.03 + 7.3, z * 0.03 + 7.3);
  // a gentle valley along the centre keeps the headline area calm
  h -= 1.6 * Math.exp(-((x * x) / 400));
  return h * 8.0;
}

export default function initTerrain(ctx) {
  const host = document.querySelector('[data-terrain]');
  if (!host) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'terrain';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return; // fallback SVG stays
  }
  host.prepend(canvas);
  host.querySelector('.hero-fallback')?.remove();

  const dpr = Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x02240f, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

  const seg = innerWidth < 700 ? 180 : 300;
  const geo = new THREE.PlaneGeometry(220, 220, seg, seg);
  geo.rotateX(-Math.PI / 2);
  {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
    geo.computeBoundingSphere();
  }

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(0, 0, -999) },
    uProbe: { value: 0 },
    uScan: { value: 0 },
    uReveal: { value: 0 },
    uGreen: { value: new THREE.Color('#3a9436') },
    uLight: { value: new THREE.Color('#7cc46f') },
    uGold: { value: new THREE.Color('#f5b21f') },
    uBase: { value: new THREE.Color('#02240f') },
    uFill: { value: new THREE.Color('#013117') },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    fog: false,
    extensions: { derivatives: true },
    vertexShader: /* glsl */ `
      varying float vH;
      varying vec3 vW;
      varying float vFog;
      void main(){
        vec3 p = position;
        vH = p.y;
        vec4 w = modelMatrix * vec4(p,1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vFog = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uGreen, uLight, uGold, uBase, uFill;
      uniform vec3 uMouse;
      uniform float uProbe, uScan, uReveal, uTime;
      varying float vH;
      varying vec3 vW;
      varying float vFog;
      float line(float v, float w){
        float d = fwidth(v);
        float f = abs(fract(v - 0.5) - 0.5) / d;
        return 1.0 - smoothstep(w - 0.5, w + 0.5, f);
      }
      void main(){
        float spacing = 0.42;
        float v = vH / spacing;
        float minor = line(v, 1.0);
        float major = line(v / 5.0, 1.6);
        // survey grid
        float gx = line(vW.x / 10.0, 0.5) + line(vW.z / 10.0, 0.5);
        vec3 col = mix(uBase, uFill, smoothstep(-6.0, 6.0, vH) * 0.8);
        col = mix(col, uGreen, minor * 0.85);
        col = mix(col, uLight, major);
        col = mix(col, uGreen, clamp(gx,0.0,1.0) * 0.08);
        // probe: gold isolines near the cursor
        float d = distance(vW.xz, uMouse.xz);
        float probe = (1.0 - smoothstep(4.0, 14.0, d)) * uProbe;
        col = mix(col, uGold, probe * max(minor, major) );
        float ring = line(d / 6.0, 0.8) * (1.0 - smoothstep(0.0, 22.0, d)) * uProbe * 0.5;
        col = mix(col, uGold, ring);
        // scan sweep
        float s = abs(vW.z - uScan);
        col += uLight * (1.0 - smoothstep(0.0, 1.6, s)) * 0.18;
        // reveal from the horizon toward the viewer
        float front = (1.0 - uReveal) * 230.0;
        float rv = smoothstep(front - 24.0, front, 70.0 - vW.z);
        col = mix(col, uBase, rv);
        float fogF = smoothstep(60.0, 125.0, vFog) * 0.92;
        gl_FragColor = vec4(mix(col, uBase, fogF), 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Survey markers: gold pins standing on the terrain
  const pins = new THREE.Group();
  const pinMat = new THREE.MeshBasicMaterial({ color: 0xf5b21f });
  const stemMat = new THREE.LineBasicMaterial({ color: 0xf5b21f, transparent: true, opacity: 0.6 });
  const pinSpots = [[-14, -8], [10, -22], [22, 4], [-26, -30], [3, -42], [-6, 8]];
  // JS port of the height function is expensive; sample via a cheap raycast against the mesh later.
  pinSpots.forEach(([x, z]) => {
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), pinMat);
    const stem = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 0, 0)]), stemMat);
    const g = new THREE.Group();
    g.add(head, stem);
    g.position.set(x, 0, z);
    g.userData = { x, z };
    pins.add(g);
  });
  scene.add(pins);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hud = document.querySelector('[data-hud-alt]');
  const hudPos = document.querySelector('[data-hud-pos]');
  let pointerInside = false;

  pins.children.forEach((g) => (g.position.y = heightAt(g.userData.x, g.userData.z) + 3.2));

  // Ray-march the analytic height field (cheaper than a mesh raycast).
  const _p = new THREE.Vector3();
  function probe() {
    raycaster.setFromCamera(ndc, camera);
    const { origin, direction } = raycaster.ray;
    let t = 0;
    for (let i = 0; i < 160; i++) {
      _p.copy(direction).multiplyScalar(t).add(origin);
      const h = heightAt(_p.x, _p.z);
      if (_p.y <= h) return _p.set(_p.x, h, _p.z);
      t += Math.max(0.25, (_p.y - h) * 0.6);
      if (t > 160) break;
    }
    return null;
  }

  const state = { scroll: 0, mx: 0, my: 0, cx: 0, cy: 0 };
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 55 : 42;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  host.addEventListener('pointermove', (e) => {
    if (ctx.reduce) return;
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    state.mx = ndc.x; state.my = ndc.y;
    pointerInside = true;
  });
  host.addEventListener('pointerleave', () => { pointerInside = false; });

  // Scroll → camera glides forward and tilts down
  if (!ctx.reduce) {
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      ScrollTrigger.create({ trigger: host, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (st) => (state.scroll = st.progress) });
    });
  }

  uniforms.uReveal.value = 1;
  gsap.to(uniforms.uReveal, { value: 0, duration: ctx.reduce ? 0 : 2.6, ease: 'expo.out', delay: 0.2 });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);

  const started = performance.now();
  let probeTarget = 0;
  let frame = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = ctx.reduce ? 0 : (performance.now() - started) / 1000;
    uniforms.uTime.value = ctx.reduce ? 0 : t;
    state.cx += (state.mx - state.cx) * 0.05;
    state.cy += (state.my - state.cy) * 0.05;
    const s = state.scroll;
    camera.position.set(state.cx * 4, 14 - s * 5 + state.cy * 1.5, 30 - s * 26);
    camera.lookAt(state.cx * 6, -2 - s * 4, -20 - s * 20);
    uniforms.uScan.value = 30 - ((t * 9) % 110);

    if (pointerInside && frame % 2 === 0) {
      const hit = probe();
      if (hit) {
        uniforms.uMouse.value.copy(hit);
        probeTarget = 1;
        if (hud) hud.textContent = `${(674 + hit.y * 9).toFixed(1)} m`;
        if (hudPos) {
          const lat = 27.1004 + hit.z * 0.0009;
          const lon = 52.6152 - hit.x * 0.0009;
          hudPos.textContent = `${lat.toFixed(4)}°S ${lon.toFixed(4)}°W`;
        }
      }
    } else if (!pointerInside) probeTarget = 0;
    uniforms.uProbe.value += (probeTarget - uniforms.uProbe.value) * 0.08;
    pins.children.forEach((g, i) => {
      g.children[0].rotation.y = t * 0.8 + i;
      g.children[0].position.y = Math.sin(t * 1.4 + i) * 0.25;
    });
    frame++;
    renderer.render(scene, camera);
  }
  tick();
}
