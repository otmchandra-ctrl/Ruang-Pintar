import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";
import fs from "node:fs";
import path from "node:path";

describe("PWA — Web App Manifest Specification", () => {
  it("returns standard Web App Manifest metadata for Ruang Pintar", () => {
    const data = manifest();

    expect(data.name).toBe("Ruang Pintar — School Digital Operating Platform");
    expect(data.short_name).toBe("Ruang Pintar");
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/");
    expect(data.theme_color).toBe("#0F172A");
    expect(data.background_color).toBe("#090D16");
    expect(data.icons).toBeDefined();
    expect(data.icons?.length).toBeGreaterThanOrEqual(4);
  });

  it("verifies all referenced icon files exist in public directory", () => {
    const data = manifest();
    const publicDir = path.resolve(process.cwd(), "public");

    data.icons?.forEach((icon) => {
      const cleanPath = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
      const filePath = path.join(publicDir, cleanPath);
      expect(fs.existsSync(filePath), `Icon file ${icon.src} must exist at ${filePath}`).toBe(true);
    });
  });

  it("includes maskable icons for Android adaptive launcher compliance", () => {
    const data = manifest();
    const maskableIcons = data.icons?.filter((icon) => icon.purpose === "maskable");

    expect(maskableIcons).toBeDefined();
    expect(maskableIcons?.length).toBeGreaterThanOrEqual(2);
    expect(maskableIcons?.some((i) => i.sizes === "192x192")).toBe(true);
    expect(maskableIcons?.some((i) => i.sizes === "512x512")).toBe(true);
  });

  it("includes practical shortcuts for quick navigation", () => {
    const data = manifest();
    expect(data.shortcuts).toBeDefined();
    expect(data.shortcuts?.length).toBeGreaterThanOrEqual(3);

    const shortcutUrls = data.shortcuts?.map((s) => s.url);
    expect(shortcutUrls).toContain("/cbt-ujian");
    expect(shortcutUrls).toContain("/jadwal-saya");
    expect(shortcutUrls).toContain("/kelas-saya");
  });
});
