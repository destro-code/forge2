export type RuntimeDebugCategory =
  "CHECK" | "EXECUTE" | "IFRAME" | "MESSAGE" | "STATE" | "ERROR" | "LIFECYCLE";

export interface RuntimeDebugEvent {
  id: number;
  timestamp: number;
  category: RuntimeDebugCategory;
  message: string;
}

type Listener = (event: RuntimeDebugEvent) => void;

let nextId = 1;
const listeners = new Set<Listener>();
const events: RuntimeDebugEvent[] = [];

export function emitRuntimeDebugEvent(
  category: RuntimeDebugCategory,
  message: string,
): RuntimeDebugEvent {
  const event = { id: nextId++, timestamp: Date.now(), category, message };
  events.push(event);
  if (events.length > 500) events.shift();
  listeners.forEach((listener) => listener(event));
  return event;
}

export function getRuntimeDebugEvents(): RuntimeDebugEvent[] {
  return [...events];
}

export function subscribeRuntimeDebug(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearRuntimeDebugEvents(): void {
  events.length = 0;
}
