import { afterEach, describe, expect, it } from "vitest";
import {
  clearRuntimeDebugEvents,
  emitRuntimeDebugEvent,
  getRuntimeDebugEvents,
  subscribeRuntimeDebug,
} from "./runtime-debug-sink";

afterEach(() => clearRuntimeDebugEvents());

describe("runtime debug sink", () => {
  it("stores and broadcasts observational events", () => {
    const received: string[] = [];
    const unsubscribe = subscribeRuntimeDebug((event) => received.push(event.message));
    emitRuntimeDebugEvent("CHECK", "Inline Check invoked");
    unsubscribe();
    emitRuntimeDebugEvent("STATE", "isRunning=true");

    expect(received).toEqual(["Inline Check invoked"]);
    expect(getRuntimeDebugEvents()).toHaveLength(2);
  });

  it("clears events without affecting subscriptions", () => {
    emitRuntimeDebugEvent("MESSAGE", "PLAYGROUND_READY accepted=true");
    clearRuntimeDebugEvents();
    expect(getRuntimeDebugEvents()).toEqual([]);
  });
});
