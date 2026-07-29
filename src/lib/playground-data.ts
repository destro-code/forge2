import type { PlaygroundPreset } from "./types/playground";

export const PLAYGROUND_PRESETS: PlaygroundPreset[] = [
  {
    id: "stale-closure-lab",
    title: "React Stale Closures & Timers",
    category: "React Core",
    difficulty: "Intermediate",
    description:
      "Diagnose and fix a stale closure inside a useEffect timer that prevents counter state updates.",
    files: [
      {
        id: "f-1",
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  // ⚠️ BUG: Stale closure in setInterval!
  useEffect(() => {
    const timer = setInterval(() => {
      console.log("Timer tick, current count is:", count);
      // count is captured at 0 when effect ran, leading to infinite count=1
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty dependency array captures initial count=0

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#e2e8f0', background: '#121318', borderRadius: 12, border: '1px solid #27272a' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Stale Closure Bug Lab</h2>
      <p style={{ color: '#a1a1aa', fontSize: 14 }}>Watch the timer tick in console. Notice count freezes at 1!</p>
      
      <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 36, fontWeight: 'bold', color: '#ff6b00', fontFamily: 'monospace' }}>
          {count}
        </span>
        <button
          onClick={() => setCount((c) => c + 5)}
          style={{ padding: '8px 16px', background: '#ff6b00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Add +5 Directly
        </button>
      </div>

      <div style={{ padding: 12, background: '#18181b', borderRadius: 8, fontSize: 12, color: '#f43f5e' }}>
        <strong>Console Output Check:</strong> Open console tab below to inspect live timer logs.
      </div>
    </div>
  );
}`,
      },
      {
        id: "f-2",
        name: "styles.css",
        language: "css",
        code: `body {
  margin: 0;
  padding: 16px;
  background-color: #090a0f;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}`,
      },
      {
        id: "f-3",
        name: "utils.ts",
        language: "typescript",
        code: `export function formatLog(message: string, value: unknown): string {
  return \`[\${new Date().toLocaleTimeString()}] \${message}: \${JSON.stringify(value)}\`;
}`,
      },
    ],
    solutionFiles: [
      {
        id: "f-1",
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  // ✅ FIXED: Using functional update form setCount(prev => prev + 1)
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prevCount) => {
        console.log("Timer tick, updating count to:", prevCount + 1);
        return prevCount + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Functional updater safely accesses latest state without re-running effect!

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#e2e8f0', background: '#121318', borderRadius: 12, border: '1px solid #22c55e' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 20, color: '#4ade80' }}>✅ Stale Closure Fixed!</h2>
      <p style={{ color: '#a1a1aa', fontSize: 14 }}>Functional update form (setCount(prev => prev + 1)) correctly accesses state.</p>
      
      <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 36, fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>
          {count}
        </span>
        <button
          onClick={() => setCount((c) => c + 5)}
          style={{ padding: '8px 16px', background: '#22c55e', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Add +5 Directly
        </button>
      </div>

      <div style={{ padding: 12, background: '#14532d33', borderRadius: 8, fontSize: 12, color: '#4ade80', border: '1px solid #22c55e44' }}>
        <strong>Status:</strong> Timer increments smoothly every second regardless of initial closures.
      </div>
    </div>
  );
}`,
      },
      {
        id: "f-2",
        name: "styles.css",
        language: "css",
        code: `body {
  margin: 0;
  padding: 16px;
  background-color: #090a0f;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}`,
      },
      {
        id: "f-3",
        name: "utils.ts",
        language: "typescript",
        code: `export function formatLog(message: string, value: unknown): string {
  return \`[\${new Date().toLocaleTimeString()}] \${message}: \${JSON.stringify(value)}\`;
}`,
      },
    ],
    hints: [
      "Check the dependency array of useEffect. What count value is trapped inside the callback closure?",
      "Use functional state update `setCount(prevCount => prevCount + 1)` to always read the current state value.",
      "Alternatively, pass `count` to the dependency array, but remember to clean up the interval properly on re-render.",
    ],
  },
  {
    id: "use-debounce-hook",
    title: "Custom Hook: useDebounce & Search",
    category: "React Hooks",
    difficulty: "Intermediate",
    description:
      "Implement a custom useDebounce hook to prevent excessive API search calls while typing.",
    files: [
      {
        id: "f-10",
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export default function SearchApp() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    console.log("🔍 Triggered API Search request for query:", debouncedQuery);
    // Mock API search
    const mockItems = ['React 19', 'TypeScript 5.8', 'TanStack Router', 'Vite Build Tool', 'Tailwind CSS v4', 'Zustand State', 'Next.js App Router'];
    const filtered = mockItems.filter(item => item.toLowerCase().includes(debouncedQuery.toLowerCase()));
    setResults(filtered);
  }, [debouncedQuery]);

  return (
    <div style={{ padding: 24, color: '#e2e8f0', background: '#121318', borderRadius: 12 }}>
      <h3>Debounced Instant Search</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          console.log("Typing raw input:", e.target.value);
          setQuery(e.target.value);
        }}
        placeholder="Type to search (e.g. React)..."
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #3f3f46', background: '#18181b', color: '#fff', fontSize: 14 }}
      />
      <div style={{ marginTop: 12, fontSize: 12, color: '#a1a1aa' }}>
        Debounced Value: <strong style={{ color: '#38bdf8' }}>"{debouncedQuery}"</strong>
      </div>

      <ul style={{ marginTop: 16, paddingLeft: 20 }}>
        {results.map((r, i) => (
          <li key={i} style={{ margin: '6px 0', color: '#4ade80' }}>{r}</li>
        ))}
      </ul>
    </div>
  );
}`,
      },
      {
        id: "f-11",
        name: "useDebounce.ts",
        language: "typescript",
        code: `import { useState, useEffect } from 'react';

// TODO: Implement custom useDebounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // ⚠️ Currently updates immediately without delay timer!
    setDebouncedValue(value);
  }, [value, delay]);

  return debouncedValue;
}`,
      },
    ],
    solutionFiles: [
      {
        id: "f-10",
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export default function SearchApp() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    console.log("🔍 Triggered API Search request for query:", debouncedQuery);
    const mockItems = ['React 19', 'TypeScript 5.8', 'TanStack Router', 'Vite Build Tool', 'Tailwind CSS v4', 'Zustand State', 'Next.js App Router'];
    const filtered = mockItems.filter(item => item.toLowerCase().includes(debouncedQuery.toLowerCase()));
    setResults(filtered);
  }, [debouncedQuery]);

  return (
    <div style={{ padding: 24, color: '#e2e8f0', background: '#121318', borderRadius: 12 }}>
      <h3>Debounced Instant Search</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          console.log("Typing raw input:", e.target.value);
          setQuery(e.target.value);
        }}
        placeholder="Type to search (e.g. React)..."
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #3f3f46', background: '#18181b', color: '#fff', fontSize: 14 }}
      />
      <div style={{ marginTop: 12, fontSize: 12, color: '#a1a1aa' }}>
        Debounced Value: <strong style={{ color: '#38bdf8' }}>"{debouncedQuery}"</strong>
      </div>

      <ul style={{ marginTop: 16, paddingLeft: 20 }}>
        {results.map((r, i) => (
          <li key={i} style={{ margin: '6px 0', color: '#4ade80' }}>{r}</li>
        ))}
      </ul>
    </div>
  );
}`,
      },
      {
        id: "f-11",
        name: "useDebounce.ts",
        language: "typescript",
        code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timer on unmount or before next effect trigger
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
      },
    ],
    hints: [
      "Use `setTimeout` inside `useEffect` to set `debouncedValue` after `delay` milliseconds.",
      "Don't forget to return a cleanup function `() => clearTimeout(timer)` so old timers cancel when input changes fast!",
    ],
  },
  {
    id: "async-abort-controller",
    title: "Async Data Fetch & AbortController",
    category: "Browser APIs",
    difficulty: "Advanced",
    description:
      "Prevent race conditions and memory leaks when switching tabs or fast re-fetching data.",
    files: [
      {
        id: "f-20",
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState, useEffect } from 'react';

export default function UserFetcher() {
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    console.log(\`📡 Fetching user data for ID: \${userId}...\`);

    // Simulated async API with random delay
    const delay = Math.random() * 2000 + 500;
    const timer = setTimeout(() => {
      setUser({ id: userId, name: \`User \${userId}\`, email: \`user\${userId}@forge.dev\` });
      setLoading(false);
      console.log(\`✅ Received user \${userId} (after \${Math.round(delay)}ms)\`);
    }, delay);

    return () => {
      // TODO: Cancel pending fetch request!
      clearTimeout(timer);
    };
  }, [userId]);

  return (
    <div style={{ padding: 24, color: '#e2e8f0', background: '#121318', borderRadius: 12 }}>
      <h3>Async Data Fetcher</h3>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        {[1, 2, 3, 4, 5].map((id) => (
          <button
            key={id}
            onClick={() => setUserId(id)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: userId === id ? '#ff6b00' : '#27272a',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            User #{id}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#eab308' }}>Loading user #{userId}...</p>
      ) : (
        <pre style={{ background: '#18181b', padding: 12, borderRadius: 8, color: '#38bdf8' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      )}
    </div>
  );
}`,
      },
    ],
    solutionFiles: [
      {
        id: "f-20",
        name: "App.tsx",
        language: "typescript",
        code: `import React, { useState, useEffect } from 'react';

export default function UserFetcher() {
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);
    console.log(\`📡 Fetching user data for ID: \${userId}...\`);

    const delay = Math.random() * 2000 + 500;
    const timer = setTimeout(() => {
      if (isSubscribed) {
        setUser({ id: userId, name: \`User \${userId}\`, email: \`user\${userId}@forge.dev\` });
        setLoading(false);
        console.log(\`✅ Received user \${userId} (after \${Math.round(delay)}ms)\`);
      } else {
        console.log(\`🛑 Ignored stale response for user \${userId}\`);
      }
    }, delay);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [userId]);

  return (
    <div style={{ padding: 24, color: '#e2e8f0', background: '#121318', borderRadius: 12 }}>
      <h3>Async Data Fetcher (Race Condition Safe)</h3>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        {[1, 2, 3, 4, 5].map((id) => (
          <button
            key={id}
            onClick={() => setUserId(id)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: userId === id ? '#ff6b00' : '#27272a',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            User #{id}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#eab308' }}>Loading user #{userId}...</p>
      ) : (
        <pre style={{ background: '#18181b', padding: 12, borderRadius: 8, color: '#38bdf8' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      )}
    </div>
  );
}`,
      },
    ],
    hints: [
      "Use a flag variable `let isSubscribed = true` in `useEffect` and set it to `false` in the cleanup function.",
      "With real fetch requests, create `const controller = new AbortController();` and pass `signal: controller.signal` to `fetch()`.",
    ],
  },
];
