import { useSyncExternalStore } from "react";

export function create<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (v: T) => {
      value = v;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    useStore(): [T, (v: T) => void] {
      const v = useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => value,
        () => initial,
      );
      return [
        v,
        (next: T) => {
          value = next;
          listeners.forEach((l) => l());
        },
      ];
    },
  };
}
