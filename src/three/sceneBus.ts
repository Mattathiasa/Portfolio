/**
 * Tiny pub/sub bridging UI components and the lazily-loaded Three scene.
 * Deliberately has no three.js imports so publishers (e.g. the Projects
 * gallery) stay out of the three chunk.
 */

type Listener = (value: number) => void;

let tunnelProgress = 0;
const listeners = new Set<Listener>();

export const setTunnelProgress = (value: number) => {
  tunnelProgress = value;
  listeners.forEach((l) => l(value));
};

export const getTunnelProgress = () => tunnelProgress;

export const onTunnelProgress = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
