import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
    nitro(),
    viteReact(),
  ],
  test: {
    setupFiles: ["./src/test/setup.ts"],
    server: {
      deps: {
        inline: ["p-retry"],
      },
    },
  },
  optimizeDeps: {
    include: ["monaco-editor"],
  },
});
