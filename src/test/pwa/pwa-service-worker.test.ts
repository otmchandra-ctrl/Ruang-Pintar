import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("PWA — Service Worker Caching Policies & Non-Negotiable Invariants", () => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const swContent = fs.readFileSync(swPath, "utf-8");

  it("ensures public/sw.js exists and has defined cache names", () => {
    expect(fs.existsSync(swPath)).toBe(true);
    expect(swContent).toContain("rp-static-v2");
    expect(swContent).toContain("rp-pages-v1");
  });

  it("precaches the /offline fallback page", () => {
    expect(swContent).toContain("PRECACHE_ASSETS");
    expect(swContent).toContain('"/offline"');
  });

  it("enforces Strict Network-Only on CBT, Auth, and API routes", () => {
    // Verifies regex patterns in swContent
    expect(swContent).toContain("/\\/cbt\\//i");
    expect(swContent).toContain("/\\/cbt-ujian/i");
    expect(swContent).toContain("/\\/api\\//i");
    expect(swContent).toContain("/\\/login/i");
    expect(swContent).toContain("/\\/actions\\//i");
  });

  it("enforces Network-Only on non-GET methods (protecting Server Actions & mutations)", () => {
    expect(swContent).toContain('request.method !== "GET"');
    expect(swContent).toContain('request.headers.get("Next-Action")');
  });

  it("handles offline fallback for navigation requests", () => {
    expect(swContent).toContain('request.mode === "navigate"');
    expect(swContent).toContain('caches.match("/offline")');
  });
});
