// Detailed axe violations dump (selectors, colors, ratios).
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";

const server = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, NODE_ENV: "production", PORT: "3182" },
  stdio: ["ignore", "pipe", "pipe"],
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, bypassCSP: true });
  await page.goto("http://localhost:3182", { waitUntil: "networkidle" });
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const out = await page.evaluate(async () => {
    const res = await window.axe.run(document, {
      runOnly: ["color-contrast"],
      resultTypes: ["violations"],
    });
    return res.violations.flatMap((v) =>
      v.nodes.map((n) => ({
        target: n.target.join(" "),
        summary: n.failureSummary ? n.failureSummary.split("\n")[1]?.trim() : "",
      })),
    );
  });
  console.log("total color-contrast violations:", out.length);
  const grouped = {};
  for (const v of out) {
    const key = v.target.split(" > ").slice(0, 2).join(" > ");
    (grouped[key] ||= []).push(v);
  }
  for (const [k, list] of Object.entries(grouped)) {
    console.log(`\n[${list.length}x] ${k}`);
    const summaries = [...new Set(list.map((l) => l.summary))];
    summaries.slice(0, 3).forEach((s) => console.log("   " + s));
  }
  fs: {
  }
  const fsMod = await import("node:fs");
  fsMod.writeFileSync("verification/axe-details.json", JSON.stringify(out, null, 2));
} finally {
  await browser.close();
  server.kill();
  await new Promise((r) => setTimeout(r, 300));
}
