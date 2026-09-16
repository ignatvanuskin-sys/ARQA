import fs from "node:fs";
const r = JSON.parse(fs.readFileSync("verification/lighthouse.json", "utf-8"));
const cat = r.categories;
console.log("URL:", r.finalDisplayedUrl);
console.log("Form factor:", r.configSettings.formFactor, "| throttling:", r.configSettings.throttlingMethod);
for (const [k, v] of Object.entries(cat)) console.log(`${v.score * 100}  ${k}`);
console.log("\n--- key metrics ---");
const audits = r.audits;
for (const id of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"]) {
  console.log(`${audits[id].displayValue}  ${id} (score ${audits[id].score})`);
}
console.log("\n--- top opportunities ---");
const opps = Object.values(audits)
  .filter((a) => a.details?.type === "opportunity" && a.details.overallSavingsMs > 50)
  .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
  .slice(0, 6);
for (const o of opps) console.log(`${Math.round(o.details.overallSavingsMs)}ms  ${o.id}  ${o.title}`);
console.log("\n--- failed audits (score<0.9, non-informative) ---");
const failed = Object.values(audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && !a.details?.overallSavingsMs);
for (const f of failed.slice(0, 10)) console.log(`score=${f.score}  ${f.id} — ${f.title}`);
