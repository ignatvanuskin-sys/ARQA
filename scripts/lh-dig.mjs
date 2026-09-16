import fs from "node:fs";
const r = JSON.parse(fs.readFileSync("verification/lighthouse.json", "utf-8"));
const a = r.audits;
const items = a["lcp-breakdown-insight"]?.details?.items ?? [];
for (const it of items) {
  if (it.subpart) console.log(`${it.subpart}: ${Number(it.duration).toFixed(0)}ms`);
  if (it.type === "node") console.log("LCP node:", it.selector, "|", (it.snippet ?? "").slice(0, 160));
}
const net = a["network-requests"]?.details?.items ?? [];
for (const i of net) if (/facade|index-|react-vendor/.test(i.url)) console.log(`${i.transferSize}B ${Number(i.networkRequestTime).toFixed(0)}->${Number(i.networkEndTime).toFixed(0)}ms ${i.url.replace("http://localhost:3183", "")}`);
console.log("\nlong tasks:", (a["long-tasks"]?.details?.items ?? []).map((t) => `${(t.url ?? "").split("/").pop()}: ${Number(t.duration).toFixed(0)}ms @${Number(t.startTime).toFixed(0)}`).join(" | "));
