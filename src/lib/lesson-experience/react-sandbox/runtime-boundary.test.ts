import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "../../../../");
const runtimeHtml = readFileSync(resolve(projectRoot, "public/react-runtime.html"), "utf8");
const runtimeScript = readFileSync(resolve(projectRoot, "public/react-runtime.js"), "utf8");
const headers = readFileSync(resolve(projectRoot, "public/_headers"), "utf8");

describe("React runtime browser boundary", () => {
  it("keeps the runtime iframe scripts-only and same-origin isolated", () => {
    expect(runtimeHtml).toContain('<script src="/vendor/react.development.js"></script>');
    expect(runtimeHtml).toContain('<script src="/vendor/react-dom.development.js"></script>');
    expect(runtimeHtml).toContain('<script src="/react-runtime.js"></script>');
    expect(runtimeHtml).not.toMatch(/https?:\/\//);
    expect(runtimeScript).toContain('Object.defineProperty(window, "fetch"');
    expect(runtimeScript).toContain('"XMLHttpRequest", "WebSocket", "EventSource"');
    expect(runtimeScript).toContain('Object.defineProperty(navigator, "sendBeacon"');
  });

  it("denies resource and network fetches at the browser document boundary", () => {
    expect(headers).toContain("/react-runtime.html");
    expect(headers).toMatch(/Content-Security-Policy:.*default-src 'none'/);
    expect(headers).toMatch(/script-src 'self'/);
    expect(headers).toMatch(/img-src 'none'/);
    expect(headers).toMatch(/media-src 'none'/);
    expect(headers).toMatch(/frame-src 'none'/);
    expect(headers).toMatch(/connect-src 'none'/);
    expect(headers).toMatch(/form-action 'none'/);
  });

  it("does not expose a host fallback or parent execution hook", () => {
    expect(runtimeScript).not.toMatch(/parent\.eval|parent\.Function|allow-same-origin/);
    expect(runtimeScript).toContain('postMessage(message, "*")');
    expect(runtimeScript).toContain("message.nonce !== nonce");
    expect(runtimeScript).toContain("message.runId !== runId");
    expect(runtimeScript).toContain("message.revision !== revision");
  });
});
