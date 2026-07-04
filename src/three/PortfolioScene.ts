import * as THREE from 'three';
import { cloud, sphere, waveGrid, tunnel, helix, convergedOrb } from './formations';

export interface SceneOptions {
  particleCount: number;
  shapeCount: number;
  interactive: boolean;
  pixelRatioCap: number;
}

/**
 * Blend/camera targets. Scroll handlers only ever write to `target`; the
 * render loop lerps the live values toward it, so scroll traffic never
 * touches the scene graph directly.
 */
export interface SceneTarget {
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  lookAtY: number;
  formationA: number;
  formationB: number;
  formationMix: number;
  accentIntensity: number;
  shapeOpacity: number;
  tunnelShift: number;
}

export const FORMATION_INDEX = {
  cloud: 0,
  sphere: 1,
  waveGrid: 2,
  tunnel: 3,
  helix: 4,
  convergedOrb: 5,
} as const;

const FORMATION_FNS = [cloud, sphere, waveGrid, tunnel, helix, convergedOrb];

const LERP = 0.05;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class PortfolioScene {
  readonly target: SceneTarget = {
    cameraX: 0,
    cameraY: 0,
    cameraZ: 35,
    lookAtY: 0,
    formationA: 0,
    formationB: 0,
    formationMix: 0,
    accentIntensity: 0.8,
    shapeOpacity: 0.2,
    tunnelShift: 0,
  };

  private live: SceneTarget = { ...this.target };

  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  private particles: THREE.Points;
  private particlesGeometry = new THREE.BufferGeometry();
  private particlesMaterial: THREE.PointsMaterial;
  private formations: Float32Array[];
  private shapes: THREE.Mesh[] = [];
  private shapeGeometries: THREE.BufferGeometry[] = [];
  private pointLight: THREE.PointLight;

  private mouse = { x: 0, y: 0 };
  private options: SceneOptions;
  private container: HTMLElement;
  private disposed = false;

  constructor(container: HTMLElement, options: SceneOptions) {
    this.container = container;
    this.options = options;
    const { particleCount, shapeCount, pixelRatioCap } = options;

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 35;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    container.appendChild(this.renderer.domElement);

    this.formations = FORMATION_FNS.map((fn) => fn(particleCount));

    const positions = new Float32Array(this.formations[0]);
    const colors = new Float32Array(particleCount * 3);

    const lime = new THREE.Color('#DDEB9D');
    const dark = new THREE.Color('#22333B');
    const cream = new THREE.Color('#FAF6E9');

    for (let i = 0; i < particleCount; i++) {
      const rand = Math.random();
      const c = rand < 0.4 ? lime : rand < 0.7 ? cream : dark;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particlesMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      map: this.createCircleTexture(),
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.01,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.particlesGeometry, this.particlesMaterial);
    this.scene.add(this.particles);

    this.shapeGeometries = [
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.IcosahedronGeometry(1, 1),
    ];
    for (let i = 0; i < shapeCount; i++) {
      const geometry = this.shapeGeometries[i % this.shapeGeometries.length];
      const material = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? '#DDEB9D' : '#FAF6E9',
        transparent: true,
        opacity: 0.2,
        wireframe: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      const s = Math.random() * 2 + 0.5;
      mesh.scale.set(s, s, s);
      this.scene.add(mesh);
      this.shapes.push(mesh);
    }

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    this.pointLight = new THREE.PointLight('#DDEB9D', 0.8);
    this.pointLight.position.set(20, 20, 20);
    this.scene.add(this.pointLight);

    if (options.interactive) {
      window.addEventListener('mousemove', this.handleMouseMove);
    }
    window.addEventListener('resize', this.handleResize);
  }

  private createCircleTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  private handleMouseMove = (event: MouseEvent) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  /** Advance and render one frame. Call from gsap.ticker. */
  update = () => {
    if (this.disposed) return;
    const t = this.clock.getElapsedTime();
    const live = this.live;
    const target = this.target;

    live.cameraX = lerp(live.cameraX, target.cameraX, LERP);
    live.cameraY = lerp(live.cameraY, target.cameraY, LERP);
    live.cameraZ = lerp(live.cameraZ, target.cameraZ, LERP);
    live.lookAtY = lerp(live.lookAtY, target.lookAtY, LERP);
    live.accentIntensity = lerp(live.accentIntensity, target.accentIntensity, LERP);
    live.shapeOpacity = lerp(live.shapeOpacity, target.shapeOpacity, LERP);
    live.tunnelShift = lerp(live.tunnelShift, target.tunnelShift, 0.08);
    if (
      live.formationA !== target.formationA ||
      live.formationB !== target.formationB
    ) {
      // New blend pair at a section boundary: both pairs resolve to the same
      // shape at the crossover, so snapping the mix is visually seamless —
      // lerping it across the swap would flash the wrong formation.
      live.formationA = target.formationA;
      live.formationB = target.formationB;
      live.formationMix = target.formationMix;
    } else {
      live.formationMix = lerp(live.formationMix, target.formationMix, 0.08);
    }

    const formA = this.formations[live.formationA];
    const formB = this.formations[live.formationB];
    const mix = live.formationMix;
    const posAttr = this.particlesGeometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const count = this.options.particleCount;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const bx = lerp(formA[ix], formB[ix], mix);
      const by = lerp(formA[ix + 1], formB[ix + 1], mix);
      const bz = lerp(formA[ix + 2], formB[ix + 2], mix);
      arr[ix] = bx + Math.sin(t * 0.2 + bz * 0.1) * 2;
      arr[ix + 1] = by + Math.cos(t * 0.3 + bx * 0.1) * 2;
      arr[ix + 2] = bz + Math.sin(t * 0.25 + by * 0.1) * 2;
    }
    posAttr.needsUpdate = true;

    this.particles.rotation.y += 0.0003;
    this.particles.position.z = live.tunnelShift;

    this.shapes.forEach((shape, index) => {
      shape.rotation.x += 0.002 * (index % 2 === 0 ? 1 : -1);
      shape.rotation.z += 0.001 * (index % 3 === 0 ? 1 : -1);
      shape.position.y += Math.sin(t * 0.5 + index) * 0.01;
      (shape.material as THREE.MeshPhongMaterial).opacity = live.shapeOpacity;
    });

    this.pointLight.intensity = live.accentIntensity;

    this.camera.position.x += (this.mouse.x * 8 + live.cameraX - this.camera.position.x) * LERP;
    this.camera.position.y += (this.mouse.y * 8 + live.cameraY - this.camera.position.y) * LERP;
    this.camera.position.z = live.cameraZ;
    this.camera.lookAt(0, live.lookAtY, 0);

    this.renderer.render(this.scene, this.camera);
  };

  /** Single static frame for prefers-reduced-motion. */
  renderStatic() {
    this.camera.position.set(0, 0, 35);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    if (this.options.interactive) {
      window.removeEventListener('mousemove', this.handleMouseMove);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    this.particlesGeometry.dispose();
    this.particlesMaterial.map?.dispose();
    this.particlesMaterial.dispose();
    this.shapeGeometries.forEach((g) => g.dispose());
    this.shapes.forEach((s) => (s.material as THREE.Material).dispose());
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
