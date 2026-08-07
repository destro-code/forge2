// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof global !== "undefined" && typeof (global as any).self === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).self = global;
}

import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  define: {
    "process.env": {},
    self: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  plugins: [react(), TanStackRouterVite()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "./index.html",
    },
  },
});
