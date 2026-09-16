import fs from "node:fs";
const html = fs.readFileSync("dist/public/index.html", "utf-8");
const picks = [
  /<link rel="canonical"[^>]*>/,
  /<meta property="og:url"[^>]*>/,
  /<meta property="og:image"[^>]*>/,
  /<meta name="twitter:image"[^>]*>/,
];
for (const re of picks) console.log(html.match(re)?.[0] ?? "MISSING");
console.log("placeholder left:", html.includes("{{SITE_URL}}"));
