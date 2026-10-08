import React from 'react';
import * as THREE from 'three';

/* Career Trajectory Engine — abstract 3D career navigation.
   A glowing path ascends through space; nodes mark completed /
   developing / future capabilities; travelers drift along it.
   Lightweight by design: one geometry set, capped pixel ratio,
   paused offscreen, static frame for reduced motion, lite tier
   for touch/small screens. */

const NODE_DEFS = [
  { at: 0.0, status: 'done', label: 'Profile' },
  { at: 0.2, status: 'done', label: 'Skills' },
  { at: 0.38, status: 'done', label: 'Role' },
  { at: 0.56, status: 'developing', label: 'Gap Analysis' },
  { at: 0.72, status: 'developing', label: 'Roadmap' },
  { at: 0.88, status: 'future', label: 'Interview' },
  { at: 1.0, status: 'future', label: 'Career Ready' }
];

const STATUS_COLOR = {
  done: new THREE.Color('#7ba795'),
  developing: new THREE.Color('#b9955a'),
  future: new THREE.Color('#7a90c4')
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function gradientTube(curve, segs, radius) {
  const geo = new THREE.TubeGeometry(curve, segs, radius, 8, false);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const stops = [
    new THREE.Color('#7ba795'),
    new THREE.Color('#b9955a'),
    new THREE.Color('#7a90c4'),
    new THREE.Color('#c96b4b')
  ];
  const pos = geo.attributes.position;
  const pt = new THREE.Vector3();
  // color by tubular segment index (u along path)
  const tubCount = segs;
  for (let i = 0; i < pos.count; i++) {
    // TubeGeometry orders vertices ring by ring: (tubularSegments+1) rings
    const ring = Math.min(tubCount, Math.floor(i / 9));
    const u = ring / tubCount;
    const seg = Math.min(stops.length - 2, Math.floor(u * (stops.length - 1)));
    const f = u * (stops.length - 1) - seg;
    const col = stops[seg].clone().lerp(stops[seg + 1], f);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    void pt;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export default function Trajectory3D() {
  const mount = React.useRef(null);

  React.useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite = window.matchMedia('(pointer: coarse)').matches || el.clientWidth < 560;

    const renderer = new THREE.WebGLRenderer({ antialias: !lite, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 60);
    camera.position.set(0, 0.5, 8.4);

    const world = new THREE.Group();
    scene.add(world);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.4, -2.4, 0.4),
      new THREE.Vector3(-2.1, -1.7, -0.5),
      new THREE.Vector3(-0.9, -0.8, 0.5),
      new THREE.Vector3(0.3, 0.1, -0.4),
      new THREE.Vector3(1.5, 1.0, 0.4),
      new THREE.Vector3(2.6, 1.9, -0.2),
      new THREE.Vector3(3.4, 2.6, 0.2)
    ]);

    const tube = new THREE.Mesh(
      gradientTube(curve, lite ? 70 : 140, 0.035),
      new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 })
    );
    world.add(tube);

    const haloTex = glowTexture();
    const nodeGroup = new THREE.Group();
    const nodeMeshes = [];
    NODE_DEFS.forEach((n) => {
      const p = curve.getPointAt(n.at);
      const col = STATUS_COLOR[n.status];
      const size = n.at === 0 || n.at === 1 ? 0.11 : 0.085;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 18, 18),
        new THREE.MeshBasicMaterial({ color: col })
      );
      mesh.position.copy(p);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: haloTex, color: col, transparent: true, opacity: n.status === 'future' ? 0.28 : 0.5, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      halo.scale.setScalar(size * 7);
      halo.position.copy(p);
      nodeGroup.add(mesh, halo);
      nodeMeshes.push({ mesh, halo, phase: n.at * Math.PI * 2, base: size });
    });
    world.add(nodeGroup);

    // travelers drifting along the path
    const travelerCount = lite ? 4 : 7;
    const travelers = [];
    for (let i = 0; i < travelerCount; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color('#63e6e2'), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      s.scale.setScalar(0.34);
      world.add(s);
      travelers.push({ s, off: i / travelerCount });
    }

    // ambient starfield
    const starCount = lite ? 90 : 190;
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 14;
      sp[i * 3 + 1] = (Math.random() - 0.5) * 9;
      sp[i * 3 + 2] = -2 - Math.random() * 6;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x8f9bb0, size: 0.025, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(stars);

    // pointer + scroll targets
    let tRX = 0, tRY = 0, cRX = 0, cRY = 0, scrollP = 0;
    function onPointer(e) {
      const r = el.getBoundingClientRect();
      tRY = ((e.clientX - r.left) / r.width - 0.5) * 0.09;
      tRX = -((e.clientY - r.top) / r.height - 0.5) * 0.07;
    }
    function onScroll() {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      scrollP = Math.max(0, Math.min(1, 1 - r.bottom / (vh + r.height)));
    }
    if (!lite && !reduced) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
    io.observe(el);

    const tmp = new THREE.Vector3();
    function frame() {
      const t = clock.getElapsedTime();
      // breath
      const br = 1 + Math.sin(t * 0.5) * 0.008;
      world.scale.setScalar(br);
      // camera drift toward pointer
      cRX += (tRX - cRX) * 0.04;
      cRY += (tRY - cRY) * 0.04;
      camera.position.x = cRY * 22;
      camera.position.y = 0.5 + cRX * 18 + scrollP * 0.5;
      camera.lookAt(0, 0.2, 0);
      world.rotation.y = scrollP * 0.35;
      // travelers
      travelers.forEach((tr, i) => {
        const u = (t * 0.045 + tr.off) % 1;
        curve.getPointAt(u, tmp);
        tr.s.position.copy(tmp);
        const tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
        tr.s.material.opacity = 0.85 * tw;
      });
      // node pulse
      nodeMeshes.forEach((n) => {
        const s = n.base * (1 + 0.14 * Math.sin(t * 1.6 + n.phase));
        n.mesh.scale.setScalar(s / n.base);
      });
      stars.rotation.y = Math.sin(t * 0.05) * 0.03;
      renderer.render(scene, camera);
    }

    function loop() {
      if (visible) frame();
      raf = requestAnimationFrame(loop);
    }
    if (reduced) {
      frame();
    } else {
      loop();
    }

    function onResize() {
      if (!el.clientWidth) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if (m.map && m.map !== haloTex) m.map.dispose();
            m.dispose();
          });
        }
      });
      haloTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="scene3d" aria-hidden="true" />;
}
