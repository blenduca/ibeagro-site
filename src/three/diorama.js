import * as THREE from 'three';

// Hero v5 — "Oeste em miniatura".
// A low-poly diorama of a farm landscape in western Santa Catarina: aviaries, pig barns, a dairy,
// the cooperative's silos, an office and a connectivity tower — roofs in the emblem colours.
// Each building is a knowledge area: hover to read it, click to jump to that area on the page.

const R = 17;
const hAt = (x, z) => Math.sin(x * 0.22) * 0.9 + Math.cos(z * 0.27) * 0.7 + Math.sin((x + z) * 0.13 + 1) * 1.1;

const SITES = [
  { id: 'aves', name: 'Aviários', area: 'Avicultura', roof: 0xf5b21f, x: 7.5, z: -6.5 },
  { id: 'suinos', name: 'Pocilgas', area: 'Suinocultura', roof: 0xd44e23, x: -7.5, z: -7 },
  { id: 'leite', name: 'Tambo leiteiro', area: 'Bovinocultura de Leite', roof: 0x0f522d, x: -9, z: 4.5 },
  { id: 'coop', name: 'Cooperativa', area: 'Cooperativismo', roof: 0x3a9436, x: 2, z: 8 },
  { id: 'gestao', name: 'Escritório da fazenda', area: 'Gestão e Liderança', roof: 0x024c7f, x: 9.5, z: 3 },
  { id: 'tec', name: 'Torre de conectividade', area: 'Tecnologia e Inovação', roof: 0x1e7fb8, x: -1.5, z: -11 },
];

function shed(len, w, h, roofColor) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(len, h, w), new THREE.MeshStandardMaterial({ color: 0xe9efe7, flatShading: true }));
  wall.position.y = h / 2;
  const roofGeo = new THREE.CylinderGeometry(w * 0.62, w * 0.62, len * 1.04, 3, 1);
  roofGeo.rotateZ(Math.PI / 2);
  const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: roofColor, flatShading: true }));
  roof.position.y = h + w * 0.18;
  roof.scale.set(1, 0.55, 1);
  g.add(wall, roof);
  return g;
}

function silo(r, h) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xcfd8d2, metalness: 0.4, roughness: 0.45, flatShading: true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), m);
  body.position.y = h / 2;
  const top = new THREE.Mesh(new THREE.ConeGeometry(r * 1.02, r * 0.8, 12), m);
  top.position.y = h + r * 0.4;
  g.add(body, top);
  return g;
}

export default function initDiorama(ctx) {
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
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x02240f, 90, 170);
  const camera = new THREE.PerspectiveCamera(small ? 42 : 30, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xdff5d8, 0x0b2312, 1.1));
  const sun = new THREE.DirectionalLight(0xffe2a0, 2.2);
  sun.position.set(14, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 });
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);

  /* ── Ground: a round diorama with crop strips on rolling hills ── */
  const ground = new THREE.PlaneGeometry(R * 2, R * 2, 64, 64);
  ground.rotateX(-Math.PI / 2);
  const pos = ground.attributes.position;
  const colors = [];
  const cS = new THREE.Color('#3a9436'), cT = new THREE.Color('#c99a22'), cM = new THREE.Color('#1d5a2a'), cP = new THREE.Color('#56a050');
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    const d = Math.hypot(x, z);
    if (d > R) { x *= R / d; z *= R / d; }
    const y = hAt(x, z);
    pos.setXYZ(i, x, y, z);
    const band = Math.floor((z + Math.sin(x * 0.3) * 2 + 40) / 2.6) % 4;
    const c = [cS, cT, cM, cP][band].clone().multiplyScalar(0.85 + Math.random() * 0.2);
    colors.push(c.r, c.g, c.b);
  }
  ground.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ground.computeVertexNormals();
  const groundMesh = new THREE.Mesh(ground.toNonIndexed(), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  groundMesh.geometry.computeVertexNormals();
  groundMesh.receiveShadow = true;
  world.add(groundMesh);

  // soil skirt: the cut through the land shows its horizons
  const skirtGeo = new THREE.CylinderGeometry(R, R, 1, 96, 4, true);
  const sp = skirtGeo.attributes.position;
  const sc = [];
  const layers = [new THREE.Color('#0f522d'), new THREE.Color('#0a4424'), new THREE.Color('#05361b'), new THREE.Color('#022712'), new THREE.Color('#011a0d')];
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), z = sp.getZ(i), yy = sp.getY(i); // yy in [-0.5, 0.5]
    const k = Math.round((0.5 - yy) * 4);
    const top = hAt(x, z);
    sp.setY(i, k === 0 ? top : top - 0.6 - k * 1.1);
    const c = layers[k];
    sc.push(c.r, c.g, c.b);
  }
  skirtGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  skirtGeo.computeVertexNormals();
  world.add(new THREE.Mesh(skirtGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide })));

  // trees
  const treeGeo = new THREE.IcosahedronGeometry(0.42, 0);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x0b3d1d, flatShading: true });
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, 140);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3();
  let ti = 0;
  for (let k = 0; ti < 140 && k < 2000; k++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (R - 1);
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    // a riparian strip of forest plus the diorama edge
    const creek = Math.abs(z - Math.sin(x * 0.35) * 3 + 1);
    if (creek > 1.4 && rr < R - 2.5) continue;
    if (SITES.some((s) => Math.hypot(s.x - x, s.z - z) < 3.4)) continue;
    const sc2 = 0.7 + Math.random() * 0.9;
    m4.compose(new THREE.Vector3(x, hAt(x, z) + 0.45 * sc2, z), q.setFromEuler(new THREE.Euler(0, Math.random() * 3, 0)), s3.set(sc2, sc2 * 1.3, sc2));
    trees.setMatrixAt(ti++, m4);
  }
  trees.count = ti;
  trees.castShadow = true;
  world.add(trees);

  /* ── Sites ── */
  const groups = [];
  SITES.forEach((s) => {
    const g = new THREE.Group();
    const y = hAt(s.x, s.z);
    g.position.set(s.x, y - 0.05, s.z);
    if (s.id === 'aves') [0, 1, 2].forEach((k) => { const b = shed(6, 1.1, 0.7, s.roof); b.position.z = k * 1.6 - 1.6; g.add(b); });
    if (s.id === 'suinos') [0, 1].forEach((k) => { const b = shed(5, 1.4, 0.8, s.roof); b.position.z = k * 1.9 - 0.95; g.add(b); });
    if (s.id === 'leite') {
      const barn = shed(3.2, 2.2, 1.3, s.roof); g.add(barn);
      const cowMat = new THREE.MeshStandardMaterial({ color: 0xf2f4ef, flatShading: true });
      for (let k = 0; k < 7; k++) {
        const cow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.2), cowMat);
        cow.position.set(-1.2 + Math.random() * 3.5, 0.2, 1.8 + Math.random() * 1.6);
        cow.rotation.y = Math.random() * 3;
        cow.userData.cow = true;
        g.add(cow);
      }
    }
    if (s.id === 'coop') {
      [[-1.2, 0, 0.55, 2.6], [0, 0, 0.55, 2.6], [1.2, 0, 0.55, 2.6], [-0.6, 1.1, 0.4, 1.8], [0.6, 1.1, 0.4, 1.8]].forEach(([x, z, r, h]) => { const sl = silo(r, h); sl.position.set(x, 0, z); g.add(sl); });
      const office = shed(2.4, 1.2, 0.9, s.roof); office.position.set(0, 0, -1.8); g.add(office);
    }
    if (s.id === 'gestao') {
      const house = shed(2.2, 1.6, 1.1, s.roof); g.add(house);
    }
    if (s.id === 'tec') {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 4.2, 6), new THREE.MeshStandardMaterial({ color: 0xd3e6d4, flatShading: true }));
      mast.position.y = 2.1; g.add(mast);
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 8), new THREE.MeshStandardMaterial({ color: s.roof, flatShading: true }));
      dish.position.y = 3.6; dish.rotation.z = Math.PI / 2; g.add(dish);
      const drone = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), new THREE.MeshStandardMaterial({ color: s.roof }));
      drone.add(body);
      [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0xf5b21f })); r.position.set(x, 0.06, z); drone.add(r); });
      drone.userData.drone = true;
      g.add(drone);
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.site = s; } });
    g.userData.site = s;
    g.userData.baseY = g.position.y;
    // pin marker above each site
    const pin = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: s.roof === 0x0f522d ? 0x7cc46f : s.roof }));
    pin.position.y = s.id === 'tec' ? 5 : 3.4;
    pin.userData.site = s;
    pin.userData.pin = true;
    g.add(pin);
    world.add(g);
    groups.push(g);
  });

  /* ── Hover / tag ── */
  const tag = document.createElement('div');
  tag.className = 'plot-tag coord';
  tag.setAttribute('aria-hidden', 'true');
  host.appendChild(tag);
  const hudLbl = host.querySelector('.hud-r span');
  const hud = document.querySelector('[data-hud-alt]');
  if (hudLbl) hudLbl.textContent = 'Área de conhecimento';
  if (hud) hud.textContent = 'Passe o mouse na maquete';

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let px = 0, py = 0, inside = false, hovered = null, auto = !ctx.finePointer, autoIdx = 0, autoT = 0;
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    ndc.set((px / r.width) * 2 - 1, -(py / r.height) * 2 + 1);
    inside = true;
  });
  host.addEventListener('pointerleave', () => { inside = false; ndc.set(9, 9); });
  host.addEventListener('click', (e) => {
    if (e.target.closest('a, button') || !hovered) return;
    const plot = document.querySelector(`.plot[data-area="${hovered.userData.site.id}"]`);
    const areas = document.getElementById('areas');
    if (areas) {
      window.__ib?.lenis ? window.__ib.lenis.scrollTo(areas, { offset: -40 }) : areas.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => plot?.click(), 700);
    }
  });
  host.addEventListener('pointerdown', () => (auto = false), { once: true });

  let scroll = 0;
  if (!ctx.reduce) import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => ScrollTrigger.create({ trigger: host, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (st) => (scroll = st.progress) }));

  const target = new THREE.Vector3();
  let fit = 1;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 46 : 30;
    fit = w > 900 ? 1.6 : Math.max(1, 0.9 / (w / h));
    // keep the diorama clear of the headline: shift the frame so it sits right (desktop) or high (phones)
    if (w > 900) camera.setViewOffset(w, h, -w * 0.2, h * 0.2, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.24, w, h);
    camera.updateProjectionMatrix();
    target.set(0, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);
  const clock = new THREE.Clock();
  let intro = 0, cx = 0, cy = 0;
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    intro = Math.min(1, intro + (ctx.reduce ? 1 : 0.012));
    const ease = 1 - Math.pow(1 - intro, 3);
    const mx = inside ? ndc.x : 0, my = inside ? ndc.y : 0;
    cx += (mx - cx) * 0.04; cy += (my - cy) * 0.04;
    const ang = (ctx.reduce ? 0.6 : 0.6 + t * 0.04) + cx * 0.25;
    const dist = 50 * fit * (1.25 - ease * 0.25) * (1 + scroll * 0.35);
    camera.position.set(Math.cos(ang) * dist * 0.72, dist * 0.55 + cy * 3 + scroll * 8, Math.sin(ang) * dist * 0.72);
    camera.lookAt(target.x, target.y, target.z);
    world.position.set(0, (1 - ease) * -6, 0);

    // hover detection
    let hit = null;
    if (inside) {
      ray.setFromCamera(ndc, camera);
      const o = ray.intersectObjects(groups, true)[0];
      if (o) hit = groups.find((g) => g.userData.site === o.object.userData.site);
    } else if (auto && !ctx.reduce) {
      autoT += 0.016;
      if (autoT > 2.6) { autoT = 0; autoIdx = (autoIdx + 1) % groups.length; }
      hit = groups[autoIdx];
    }
    if (hit !== hovered) {
      hovered = hit;
      host.style.cursor = hit && inside ? 'pointer' : '';
      if (hit) {
        const s = hit.userData.site;
        tag.innerHTML = `<b>${s.name}</b><span>${s.area}</span>${inside ? '<span>Clique para explorar →</span>' : ''}`;
        if (hud) hud.textContent = s.area;
      }
    }
    groups.forEach((g) => {
      const on = g === hovered;
      g.position.y += ((g.userData.baseY + (on ? 0.6 : 0)) - g.position.y) * 0.12;
      g.children.forEach((c) => {
        if (c.userData.pin) { c.rotation.y = t * 1.5; c.position.y += ((on ? 4.6 : 3.4) * (g.userData.site.id === 'tec' ? 1.35 : 1) - c.position.y) * 0.1; }
        if (c.userData.drone) { c.position.set(Math.cos(t * 0.8) * 2.2, 2.6 + Math.sin(t * 2) * 0.2, Math.sin(t * 0.8) * 2.2); c.rotation.y = -t * 0.8; }
        if (c.userData.cow && !ctx.reduce) c.rotation.y += Math.sin(t + c.position.x) * 0.002;
      });
    });
    if (hovered) {
      const p = new THREE.Vector3();
      hovered.getWorldPosition(p);
      p.y += 3;
      p.project(camera);
      const w = host.clientWidth, h = host.clientHeight;
      tag.style.transform = `translate(${Math.max(10, Math.min((p.x * 0.5 + 0.5) * w + 14, w - tag.offsetWidth - 10))}px, ${Math.max(10, (-p.y * 0.5 + 0.5) * h - 10)}px)`;
    }
    tag.style.opacity = hovered ? '1' : '0';
    renderer.render(scene, camera);
  })();
}
