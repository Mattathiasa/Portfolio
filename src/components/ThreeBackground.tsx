import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const clock = new THREE.Clock();
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 35;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 4000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const initialPositions = new Float32Array(particlesCount * 3);

    const color1 = new THREE.Color('#DDEB9D'); // Lime accent
    const color2 = new THREE.Color('#22333B'); // Dark background
    const color3 = new THREE.Color('#FAF6E9'); // Cream

    for (let i = 0; i < particlesCount; i++) {
      const x = (Math.random() - 0.5) * 120;
      const y = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      const mixedColor = new THREE.Color();
      const rand = Math.random();
      if (rand < 0.4) {
        mixedColor.copy(color1);
      } else if (rand < 0.7) {
        mixedColor.copy(color3);
      } else {
        mixedColor.copy(color2);
      }

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create circular texture for particles
    const createCircleTexture = () => {
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
    };

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.01,
      depthWrite: false
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Create soccer ball-like geometric shapes
    const geometries = [
      new THREE.IcosahedronGeometry(1.2, 1), // Soccer ball-like faceted structure
      new THREE.IcosahedronGeometry(1, 1),
    ];

    const shapes: THREE.Mesh[] = [];
    for (let i = 0; i < 15; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? '#DDEB9D' : '#FAF6E9',
        transparent: true,
        opacity: 0.2, // Increased slightly for visibility
        wireframe: true,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      const s = Math.random() * 2 + 0.5;
      mesh.scale.set(s, s, s);
      scene.add(mesh);
      shapes.push(mesh);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#DDEB9D', 0.8);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    // Target values for smoothing
    const targetRotation = { x: 0, y: 0 };
    const lerpSpeed = 0.05;

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
      targetRotation.x = mousePosition.current.y * 0.2;
      targetRotation.y = mousePosition.current.x * 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Dynamic particle movement
      const posAttr = particlesGeometry.attributes.position;
      for (let i = 0; i < particlesCount; i++) {
        const x = initialPositions[i * 3];
        const y = initialPositions[i * 3 + 1];
        const z = initialPositions[i * 3 + 2];

        // Organic floating motion
        posAttr.array[i * 3] = x + Math.sin(elapsedTime * 0.2 + z * 0.1) * 2;
        posAttr.array[i * 3 + 1] = y + Math.cos(elapsedTime * 0.3 + x * 0.1) * 2;
        posAttr.array[i * 3 + 2] = z + Math.sin(elapsedTime * 0.25 + y * 0.1) * 2;
      }
      posAttr.needsUpdate = true;

      particles.rotation.y += 0.0003;

      shapes.forEach((shape, index) => {
        shape.rotation.x += 0.002 * (index % 2 === 0 ? 1 : -1);
        shape.rotation.z += 0.001 * (index % 3 === 0 ? 1 : -1);
        shape.position.y += Math.sin(elapsedTime * 0.5 + index) * 0.01;
      });

      // Smooth camera interpolation
      camera.position.x += (mousePosition.current.x * 8 - camera.position.x) * lerpSpeed;
      camera.position.y += (mousePosition.current.y * 8 - camera.position.y) * lerpSpeed;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      geometries.forEach(g => g.dispose());
      shapes.forEach(s => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
};
