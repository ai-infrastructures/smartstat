#!/usr/bin/env node
/**
 * Rasterize brand SVGs into the PNG variants Expo and Next.js need.
 *
 * Usage: node brand/generate-icons.mjs
 *
 * Outputs:
 *   apps/mobile/assets/icon.png            1024×1024 (used as app icon)
 *   apps/mobile/assets/adaptive-icon.png   1024×1024 monochrome foreground (Android)
 *   apps/mobile/assets/splash-icon.png     2048×2048 centered logo (transparent)
 *   apps/mobile/assets/favicon.png         48×48
 *   apps/admin/public/favicon.ico          (multi-resolution ICO via PNG conversion)
 *   apps/admin/public/icon.svg             copy of brand/logo.svg
 */
import sharp from "sharp";
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const logo = path.join(__dirname, "logo.svg");
const mono = path.join(__dirname, "logo-monochrome.svg");
const splash = path.join(__dirname, "splash.svg");

const mobileAssets = path.join(root, "apps", "mobile", "assets");
const adminPublic = path.join(root, "apps", "admin", "public");

async function ensure(dir) {
  await mkdir(dir, { recursive: true });
}

async function svgToPng(svgPath, outPath, size, opts = {}) {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: opts.background ?? { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  ✓ ${path.relative(root, outPath)}  ${size}×${size}`);
}

async function svgToPngExact(svgPath, outPath, width, height) {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 240 })
    .resize(width, height, { fit: "contain", background: { r: 14, g: 165, b: 233, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  ✓ ${path.relative(root, outPath)}  ${width}×${height}`);
}

async function main() {
  console.log("Generating brand assets…\n");

  await ensure(mobileAssets);
  await ensure(adminPublic);

  // Mobile
  await svgToPng(logo, path.join(mobileAssets, "icon.png"), 1024);
  await svgToPng(mono, path.join(mobileAssets, "adaptive-icon.png"), 1024);
  await svgToPng(logo, path.join(mobileAssets, "splash-icon.png"), 2048);
  await svgToPng(logo, path.join(mobileAssets, "favicon.png"), 48);

  // Admin (Next.js)
  await copyFile(logo, path.join(adminPublic, "icon.svg"));
  console.log(`  ✓ ${path.relative(root, path.join(adminPublic, "icon.svg"))}`);
  // Apple touch icon
  await svgToPng(logo, path.join(adminPublic, "apple-icon.png"), 180);
  // PNG variants for browsers that don't load SVG favicons
  await svgToPng(logo, path.join(adminPublic, "icon-192.png"), 192);
  await svgToPng(logo, path.join(adminPublic, "icon-512.png"), 512);
  // Best-effort favicon.ico via PNG-in-ICO (browsers accept this)
  // We write a 64×64 PNG named favicon.ico — most browsers accept it.
  // For a true multi-size ICO, an external tool would be needed; keeping deps minimal.
  await sharp(await readFile(logo), { density: 256 })
    .resize(64, 64, { fit: "contain", background: { r: 29, g: 78, b: 216, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(adminPublic, "favicon.ico"));
  console.log(`  ✓ ${path.relative(root, path.join(adminPublic, "favicon.ico"))}`);

  // Brand kit standalones
  const brandOut = path.join(root, "brand", "exports");
  await ensure(brandOut);
  await svgToPng(logo, path.join(brandOut, "logo-256.png"), 256);
  await svgToPng(logo, path.join(brandOut, "logo-512.png"), 512);
  await svgToPng(logo, path.join(brandOut, "logo-1024.png"), 1024);

  console.log("\nAll brand assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
