import { defineConfig, type Plugin } from "vite";

const runtimeCsp =
  "default-src 'none'; script-src 'self' 'unsafe-eval'; style-src 'unsafe-inline'; img-src 'none'; media-src 'none'; frame-src 'none'; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

function runtimeSecurityHeaders(): Plugin {
  const apply = (response: { setHeader: (name: string, value: string) => void }, url?: string) => {
    if (url?.split("?", 1)[0] !== "/react-runtime.html") return;
    response.setHeader("Content-Security-Policy", runtimeCsp);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
  };

  return {
    name: "runtime-security-headers",
    configureServer(server) {
      server.httpServer?.prependListener("request", (request, response) => {
        apply(response, request.url);
      });
    },
    configurePreviewServer(server) {
      server.httpServer?.prependListener("request", (request, response) => {
        apply(response, request.url);
      });
    },
  };
}
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
    runtimeSecurityHeaders(),
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
