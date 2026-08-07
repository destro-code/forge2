import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed reactive store. SSR-safe: returns the fallback until hydration.
 */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: T | null = null;
  let hydrated = false;

  function read(): T {
    if (typeof window === "undefined") return fallback;
    if (!hydrated) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            typeof fallback === "object" &&
            fallback !== null &&
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            cache = { ...fallback, ...parsed };
          } else {
            cache = parsed as T;
          }
        } else {
          cache = fallback;
        }
      } catch {
        cache = fallback;
      }
      hydrated = true;
    }
    return (cache ?? fallback) as T;
  }

  function write(next: T) {
    cache = next;
    hydrated = true;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
    }
    listeners.forEach((l) => l());
  }

  function update(updater: (prev: T) => T) {
    const next = updater(read());
    write(next);
  }

  function subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  }

  function useStore(): [T, (updater: T | ((prev: T) => T)) => void] {
    const value = useSyncExternalStore(
      subscribe,
      () => read(),
      () => fallback,
    );
    return [
      value,
      (updater) => {
        const next = typeof updater === "function" ? (updater as (p: T) => T)(read()) : updater;
        write(next);
      },
    ];
  }

  return { read, write, update, subscribe, useStore };
}
