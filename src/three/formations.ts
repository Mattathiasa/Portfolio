/**
 * Particle formation targets. Each returns a Float32Array of count * 3
 * positions the scene lerps between as the user scrolls through sections.
 */

export type Formation = (count: number) => Float32Array;

export const cloud: Formation = (count) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 120;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 120;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 120;
  }
  return arr;
};

export const sphere: Formation = (count) => {
  const arr = new Float32Array(count * 3);
  const radius = 20;
  // Fibonacci sphere for even coverage, offset right so About copy sits left.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = 0.85 + Math.random() * 0.3;
    arr[i * 3] = Math.cos(theta) * r * radius * jitter + 10;
    arr[i * 3 + 1] = y * radius * jitter;
    arr[i * 3 + 2] = Math.sin(theta) * r * radius * jitter - 5;
  }
  return arr;
};

export const waveGrid: Formation = (count) => {
  const arr = new Float32Array(count * 3);
  const side = Math.ceil(Math.sqrt(count));
  const spacing = 90 / side;
  for (let i = 0; i < count; i++) {
    const col = i % side;
    const row = Math.floor(i / side);
    const x = (col - side / 2) * spacing;
    const z = (row - side / 2) * spacing;
    arr[i * 3] = x;
    arr[i * 3 + 1] = Math.sin(x * 0.15) * 4 + Math.cos(z * 0.15) * 4 - 12;
    arr[i * 3 + 2] = z;
  }
  return arr;
};

export const tunnel: Formation = (count) => {
  const arr = new Float32Array(count * 3);
  const rings = 40;
  const perRing = Math.ceil(count / rings);
  for (let i = 0; i < count; i++) {
    const ring = Math.floor(i / perRing);
    const angle = ((i % perRing) / perRing) * Math.PI * 2 + ring * 0.2;
    const radius = 14 + Math.random() * 6;
    arr[i * 3] = Math.cos(angle) * radius;
    arr[i * 3 + 1] = Math.sin(angle) * radius;
    arr[i * 3 + 2] = 30 - ring * 4 - Math.random() * 2;
  }
  return arr;
};

export const helix: Formation = (count) => {
  const arr = new Float32Array(count * 3);
  const turns = 5;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const strand = i % 2 === 0 ? 0 : Math.PI;
    const angle = t * Math.PI * 2 * turns + strand;
    const radius = 12 + Math.random() * 3;
    arr[i * 3] = Math.cos(angle) * radius;
    arr[i * 3 + 1] = (t - 0.5) * 70;
    arr[i * 3 + 2] = Math.sin(angle) * radius - 5;
  }
  return arr;
};

export const convergedOrb: Formation = (count) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Gaussian-ish density: sum of randoms biases toward the center.
    const r = (Math.random() + Math.random() + Math.random()) / 3 * 11;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 2;
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
};
