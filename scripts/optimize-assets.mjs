// Optimizes assets from assets-src/ into client/public/assets/.
// Usage: node scripts/optimize-assets.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(import.meta.dirname, "..", "assets-src");
const OUT = path.resolve(import.meta.dirname, "..", "client", "public", "assets");
fs.mkdirSync(OUT, { recursive: true });

const kb = (p) => `${(fs.statSync(p).size / 1024).toFixed(0)} KB`;

// Photo sets: [source, output base, widths]
const photos = [
  ["facade_6c49e98a.jpg", "facade", [640, 960, 1280, 1920, 2400]], // hero + og
  ["building_ef5e753d.jpg", "building", [640, 960, 1280]],
  ["work_1df29502.jpg", "work", [640, 960, 1280]],
];

for (const [src, base, widths] of photos) {
  const input = path.join(SRC, src);
  const meta = await sharp(input).metadata();
  for (const w of widths) {
    if (w > meta.width) continue;
    const resize = { width: w, withoutEnlargement: true };
    await sharp(input).resize(resize).webp({ quality: 78 }).toFile(path.join(OUT, `${base}-${w}.webp`));
    await sharp(input).resize(resize).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, `${base}-${w}.jpg`));
  }
  console.log(`${base}: ${widths.join("/")} webp+jpg from ${meta.width}x${meta.height}`);
}

// Logos keep transparency: webp (modern) + original png (fallback).
for (const [src, base] of [
  ["arqa-logo-light-final_4994abc7.png", "logo-light"],
  ["arqa-logo-dark-final_4b2d0e4f.png", "logo-dark"],
]) {
  const input = path.join(SRC, src);
  const meta = await sharp(input).metadata();
  await sharp(input).resize({ width: Math.min(meta.width, 480) }).webp({ quality: 90 }).toFile(path.join(OUT, `${base}.webp`));
  fs.copyFileSync(input, path.join(OUT, `${base}.png`));
  console.log(`${base}: webp + png (${kb(path.join(OUT, `${base}.webp`))} / ${kb(path.join(OUT, `${base}.png`))})`);
}

// Favicon set + apple-touch-icon from the original square icon.
const icon = path.join(SRC, "arqa-favicon-final_4532a104.png");
for (const size of [16, 32, 48, 180, 192, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}.png`;
  await sharp(icon).resize(size, size).png().toFile(path.join(OUT, name));
}
// Favicon.ico-style default: browsers that ignore the set get the 32px png as favicon.png.
await sharp(icon).resize(32, 32).png().toFile(path.join(OUT, "favicon.png"));
console.log("favicons: 16/32/48/192/512 + apple-touch-icon 180");

// og-image 1200x630, center-cropped from the facade photo.
await sharp(path.join(SRC, "facade_6c49e98a.jpg"))
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(OUT, "og-image.jpg"));
console.log(`og-image: ${kb(path.join(OUT, "og-image.jpg"))}`);

// Hero video: copy as-is (335 KB is already small).
fs.copyFileSync(path.join(SRC, "arqa-hero-placeholder_a4795a03.mp4"), path.join(OUT, "hero.mp4"));
console.log(`hero.mp4: ${kb(path.join(OUT, "hero.mp4"))}`);
