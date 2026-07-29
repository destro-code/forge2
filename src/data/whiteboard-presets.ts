export interface WhiteboardPreset {
  id: string;
  title: string;
  mode: "explain" | "predict" | "debug" | "improve" | "architecture";
  category: "JavaScript" | "TypeScript" | "React" | "CSS / HTML" | "System Architecture";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  code: string;
  expectedOutput?: string[];
  architectureNodes?: {
    id: string;
    label: string;
    type: "client" | "gateway" | "service" | "store" | "db" | "queue";
    x: number;
    y: number;
  }[];
  architectureEdges?: {
    id: string;
    from: string;
    to: string;
    label: string;
  }[];
}

export const WHITEBOARD_PRESETS: WhiteboardPreset[] = [
  // 1. EXPLAIN CODE
  {
    id: "exp-debounce-throttle",
    title: "Custom Debounce & Throttle Hooks with Cancel",
    mode: "explain",
    category: "React",
    difficulty: "Intermediate",
    description:
      "Analyze timing mechanics, closure references, and cleanup traps in high-frequency event handlers.",
    code: `import { useRef, useCallback, useEffect } from 'react';

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep latest callback reference without invalidating effect
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel]
  );

  useEffect(() => cancel, [cancel]);

  return { debouncedFn, cancel };
}`,
  },
  {
    id: "exp-virtual-list",
    title: "Virtualized List Rendering Algorithm",
    mode: "explain",
    category: "TypeScript",
    difficulty: "Advanced",
    description:
      "Line-by-line breakdown of index window calculation, overscan buffer, and scrollTop translation.",
    code: `interface VirtualListConfig {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
  overscan?: number;
}

export function calculateVirtualWindow({
  itemCount,
  itemHeight,
  containerHeight,
  scrollTop,
  overscan = 3
}: VirtualListConfig) {
  const totalHeight = itemCount * itemHeight;
  
  // Calculate visible range
  const rawStartIndex = Math.floor(scrollTop / itemHeight);
  const rawEndIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

  // Apply overscan padding
  const startIndex = Math.max(0, rawStartIndex - overscan);
  const endIndex = Math.min(itemCount - 1, rawEndIndex + overscan);

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      offsetTop: i * itemHeight,
    });
  }

  return {
    totalHeight,
    startIndex,
    endIndex,
    virtualItems,
  };
}`,
  },
  {
    id: "exp-promise-all-settled",
    title: "Custom Promise.allSettled Polyfill",
    mode: "explain",
    category: "JavaScript",
    difficulty: "Intermediate",
    description:
      "Understand async iterable iteration, pending promise counter, and resolution guarantee.",
    code: `function myAllSettled<T>(promises: Array<Promise<T> | T>) {
  return new Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: any }>>((resolve) => {
    if (!promises || promises.length === 0) {
      return resolve([]);
    }

    const results: any[] = new Array(promises.length);
    let completedCount = 0;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((value) => {
          results[index] = { status: 'fulfilled', value };
        })
        .catch((reason) => {
          results[index] = { status: 'rejected', reason };
        })
        .finally(() => {
          completedCount += 1;
          if (completedCount === promises.length) {
            resolve(results);
          }
        });
    });
  });
}`,
  },

  // 2. PREDICT OUTPUT
  {
    id: "pred-event-loop-microtasks",
    title: "Event Loop: Promises, Microtasks & Timers",
    mode: "predict",
    category: "JavaScript",
    difficulty: "Intermediate",
    description:
      "Predict the order of console logs across synchronous code, microtask queue, and macrotask queue.",
    code: `console.log("1: Start");

setTimeout(() => {
  console.log("2: Timeout 1");
  Promise.resolve().then(() => console.log("3: Microtask inside Timeout"));
}, 0);

Promise.resolve().then(() => {
  console.log("4: Promise 1");
  queueMicrotask(() => console.log("5: Microtask inside Promise"));
});

Promise.resolve().then(() => {
  console.log("6: Promise 2");
});

console.log("7: End");`,
    expectedOutput: [
      "1: Start",
      "7: End",
      "4: Promise 1",
      "6: Promise 2",
      "5: Microtask inside Promise",
      "2: Timeout 1",
      "3: Microtask inside Timeout",
    ],
  },
  {
    id: "pred-closures-scope-trap",
    title: "Closure & Scope Chain Hoisting Trap",
    mode: "predict",
    category: "JavaScript",
    difficulty: "Intermediate",
    description: "Trace variable environment, lexical scoping, and IIFE execution.",
    code: `var name = "Global";

function outer() {
  console.log("A:", name);
  var name = "Local";

  function inner() {
    console.log("B:", name);
  }

  return inner;
}

const fn = outer();
fn();

console.log("C:", name);`,
    expectedOutput: ["A: undefined", "B: Local", "C: Global"],
  },
  {
    id: "pred-react-state-batching",
    title: "React State Batching & Async Closure Trap",
    mode: "predict",
    category: "React",
    difficulty: "Advanced",
    description:
      "Simulate React state updates across automatic batching and stale closures inside setTimeout.",
    code: `// Imagine this React component handler:
let count = 0;
function setCount(updater: any) {
  if (typeof updater === 'function') count = updater(count);
  else count = updater;
  console.log("Render count:", count);
}

function handleClick() {
  console.log("Initial:", count);
  
  setCount(count + 1);
  setCount(count + 1);
  setCount((prev: number) => prev + 5);

  setTimeout(() => {
    console.log("Inside setTimeout - captured count:", count);
    setCount(count + 1);
  }, 0);
}

handleClick();`,
    expectedOutput: [
      "Initial: 0",
      "Render count: 1",
      "Render count: 1",
      "Render count: 6",
      "Inside setTimeout - captured count: 6",
      "Render count: 7",
    ],
  },

  // 3. DEBUG CODE
  {
    id: "debug-react-memory-leak",
    title: "React useEffect Detached Window Listener Leak",
    mode: "debug",
    category: "React",
    difficulty: "Intermediate",
    description:
      "Locate the memory leak and missing dependency cleanups causing multi-listener buildup.",
    code: `import { useState, useEffect } from 'react';

export function WindowSizeTracker() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      console.log("Window resized!");
    }

    // BUG: Missing window.removeEventListener cleanup!
    window.addEventListener('resize', handleResize);
  }, [size]); // BUG: Stale dependency causes re-subscribing on every single resize!

  return <div>Size: {size.width} x {size.height}</div>;
}`,
  },
  {
    id: "debug-async-race-condition",
    title: "Async Search Race Condition in React",
    mode: "debug",
    category: "TypeScript",
    difficulty: "Advanced",
    description:
      "Identify how stale network responses overwrite newer search results and fix with AbortController.",
    code: `import { useState, useEffect } from 'react';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);

    // BUG: No AbortController or ignore flag!
    // If user types "a" (slow network) then "ab" (fast network),
    // response for "a" arrives LAST and overwrites results for "ab"!
    fetch(\`/api/search?q=\${query}\`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.items);
        setLoading(false);
      });
  }, [query]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}`,
  },

  // 4. IMPROVE CODE
  {
    id: "imp-heavy-re-render",
    title: "Monolithic Component with Heavy Re-renders",
    mode: "improve",
    category: "React",
    difficulty: "Intermediate",
    description:
      "Refactor expensive calculations, unmemoized inline functions, and prop drilling into clean subcomponents.",
    code: `import React, { useState } from 'react';

export function HeavyDashboard({ items }: { items: { id: string; name: string; score: number }[] }) {
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('light');

  // Expensive computation recalculates on EVERY theme toggle!
  const filteredItems = items.filter((item) => {
    console.log("Expensive filtering running...");
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

  const topScorer = filteredItems.reduce((max, item) => (item.score > max.score ? item : max), items[0] || { score: 0 });

  return (
    <div className={theme}>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle Theme</button>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter items..." />
      
      <div>Top Scorer: {topScorer?.name}</div>

      <ul>
        {filteredItems.map((item) => (
          <li key={item.id} onClick={() => alert(\`Clicked \${item.name}\`)}>
            {item.name} - {item.score}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
  },
  {
    id: "imp-inaccessible-dropdown",
    title: "Inaccessible Custom Dropdown to Accessible ARIA Widget",
    mode: "improve",
    category: "CSS / HTML",
    difficulty: "Intermediate",
    description:
      "Transform div-based dropdown into a fully WCAG compliant, keyboard-navigable combobox.",
    code: `import { useState } from 'react';

// INACCESSIBLE ORIGINAL:
export function BadCustomSelect({ options, onSelect }: { options: string[]; onSelect: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('');

  return (
    <div className="custom-select">
      <div className="select-header" onClick={() => setIsOpen(!isOpen)}>
        {selected || "Choose an option..."}
      </div>
      {isOpen && (
        <div className="select-options">
          {options.map((opt) => (
            <div
              key={opt}
              className="select-item"
              onClick={() => {
                setSelected(opt);
                onSelect(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`,
  },

  // 5. ARCHITECTURE QUESTIONS
  {
    id: "arch-crdt-collaborative",
    title: "Real-time Collaborative Whiteboard System Design",
    mode: "architecture",
    category: "System Architecture",
    difficulty: "Advanced",
    description:
      "Design real-time collaborative canvas architecture with CRDT state synchronization, WebSocket fallback, and offline IndexedDB persistence.",
    code: `// SYSTEM SPECIFICATION & ARCHITECTURE QUESTION:
//
// Question: Design a high-performance real-time collaborative whiteboard (like Figma / Excalidraw) for 50+ concurrent users per board.
//
// Requirements:
// 1. Low-latency vector drawing & shape rendering (60 FPS).
// 2. Conflict-free replicated data type (CRDT) for offline editing & auto-reconciliation.
// 3. WebSocket gateway with heartbeats and room partitioning.
// 4. Persistence layer with periodic snapshots and event-sourcing delta logs.
// 5. Optimistic local updates with undo/redo stack.

interface CollaborativeCanvasArchitecture {
  clientLayer: {
    renderer: "HTML5 Canvas 2D / WebGL";
    localStore: "IndexedDB / Yjs / Automerge";
    syncEngine: "WebSocket Client + Exponential Backoff";
  };
  serverLayer: {
    gateway: "WebSocket Edge Nodes (Cloudflare Durable Objects or Node/WS)";
    persistence: "PostgreSQL Snapshots + Redis Delta Stream";
  };
}`,
    architectureNodes: [
      { id: "client1", label: "Client A (Canvas + CRDT)", type: "client", x: 100, y: 100 },
      { id: "client2", label: "Client B (Canvas + CRDT)", type: "client", x: 100, y: 300 },
      { id: "ws-gateway", label: "WebSocket Gateway Edge", type: "gateway", x: 400, y: 200 },
      { id: "sync-room", label: "Room State Sync Worker", type: "service", x: 700, y: 200 },
      { id: "redis-cache", label: "Redis Delta Stream", type: "store", x: 700, y: 400 },
      { id: "db-snapshot", label: "Snapshot Database", type: "db", x: 1000, y: 200 },
    ],
    architectureEdges: [
      { id: "e1", from: "client1", to: "ws-gateway", label: "WS Operations Delta" },
      { id: "e2", from: "client2", to: "ws-gateway", label: "WS Operations Delta" },
      { id: "e3", from: "ws-gateway", to: "sync-room", label: "Broadcast Message" },
      { id: "e4", from: "sync-room", to: "redis-cache", label: "Pub/Sub Sync" },
      { id: "e5", from: "sync-room", to: "db-snapshot", label: "Periodic Snapshot (10s)" },
    ],
  },
  {
    id: "arch-micro-frontend-shell",
    title: "Micro-Frontend Container Shell & State Contract",
    mode: "architecture",
    category: "System Architecture",
    difficulty: "Advanced",
    description:
      "Design micro-frontend architecture with Module Federation, shared design system tokens, cross-app event bus, and SSR fallback.",
    code: `// SYSTEM SPECIFICATION & ARCHITECTURE QUESTION:
//
// Question: Design a enterprise micro-frontend shell hosting 4 independent team apps (Checkout, Search, Account, Catalog).
//
// Core Challenges:
// 1. Module Federation runtime dependency sharing (React, Design System).
// 2. Cross-mfe state communication without tight coupling.
// 3. Routing synchronization and nested layout boundaries.
// 4. Performance: Asset prefetching and isolated error boundaries.`,
    architectureNodes: [
      { id: "app-shell", label: "Host App Shell (Orchestrator)", type: "client", x: 100, y: 200 },
      { id: "event-bus", label: "Global Event Bus / CustomEvent", type: "store", x: 400, y: 100 },
      { id: "mfe-checkout", label: "MFE Checkout (Remote 1)", type: "service", x: 400, y: 250 },
      { id: "mfe-catalog", label: "MFE Catalog (Remote 2)", type: "service", x: 400, y: 400 },
      { id: "cdn-federation", label: "CDN Bundle Distribution", type: "gateway", x: 750, y: 250 },
    ],
    architectureEdges: [
      { id: "me1", from: "app-shell", to: "mfe-checkout", label: "Dynamic Import" },
      { id: "me2", from: "app-shell", to: "mfe-catalog", label: "Dynamic Import" },
      { id: "me3", from: "mfe-checkout", to: "event-bus", label: "Publish CART_UPDATE" },
      { id: "me4", from: "mfe-catalog", to: "cdn-federation", label: "Fetch remoteEntry.js" },
    ],
  },
];
