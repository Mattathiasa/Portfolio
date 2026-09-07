import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '@/lib/gsap';

const BG = 0x0e191d;
const LIME = 0xddeb9d;
const CREAM = 0xf3efe2;

/**
 * Ambient point field behind all content: slow y-rotation, x-rotation tied to
 * scroll, camera eased toward the mouse. Throttled to 30fps, low-power GL.
 */
const SceneCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG, 0.028);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.z = 26;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch {
      return; // no WebGL — page works fine without the backdrop
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Point cloud: 35% lime / 65% cream in a wide shallow box.
    const count = window.innerWidth < 820 ? 700 : 1600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const lime = new THREE.Color(LIME);
    const cream = new THREE.Color(CREAM);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      const color = Math.random() < 0.35 ? lime : cream;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    let scrollY = window.scrollY;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // 30fps render loop.
    let rafId = 0;
    let last = 0;
    const tick = (t: number) => {
      rafId = requestAnimationFrame(tick);
      if (t - last < 33) return;
      last = t;

      points.rotation.y += 0.0004;
      points.rotation.x = scrollY * 0.00012;
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
};

export default SceneCanvas;
