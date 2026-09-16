// Downloads original assets from Manus Forge storage into assets-src/.
// Requires FORGE_KEY env variable (never commit it — use .env.local).
// Usage: node scripts/fetch-assets.mjs
const KEY = process.env.FORGE_KEY;
if (!KEY) {
  console.error("Set FORGE_KEY env variable first.");
  process.exit(1);
}

const BASE = "https://forge.manus.ai";
const OUT = new URL("../assets-src/", import.meta.url);
const fs = await import("node:fs");
fs.mkdirSync(OUT, { recursive: true });

const files = [
  "arqa-favicon-final_4532a104.png",
  "arqa-logo-light-final_4994abc7.png",
  "arqa-logo-dark-final_4b2d0e4f.png",
  "facade_6c49e98a.jpg",
  "building_ef5e753d.jpg",
  "work_1df29502.jpg",
  "arqa-hero-placeholder_a4795a03.mp4",
];

for (const f of files) {
  const r = await fetch(`${BASE}/v1/storage/presign/get?path=${f}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) {
    console.error(`presign failed for ${f}: ${r.status}`);
    continue;
  }
  const { url } = await r.json();
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`download failed for ${f}: ${res.status}`);
    continue;
  }
  const local = new URL(f, OUT);
  fs.writeFileSync(local, Buffer.from(await res.arrayBuffer()));
  console.log(`ok ${f} (${(fs.statSync(local).size / 1024).toFixed(0)} KB)`);
}
