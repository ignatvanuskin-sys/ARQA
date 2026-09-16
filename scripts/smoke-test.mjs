// One-off smoke test: starts the production server bundle, hits endpoints, exits.
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, NODE_ENV: "production", PORT: "3179" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
child.stdout.on("data", (d) => (serverLog += d));
child.stderr.on("data", (d) => (serverLog += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);

const base = "http://localhost:3179";
async function hit(label, path, init) {
  const res = await fetch(base + path, init);
  const body = res.headers.get("content-type")?.includes("json") ? JSON.stringify(await res.json()) : `${(await res.text()).length} bytes`;
  console.log(`${label}: ${res.status} ${body}`);
}

try {
  await hit("health   ", "/api/health");
  await hit("invalid  ", "/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "", phone: "", car: "", date: "", time: "", issue: "" }) });
  await hit("honeypot ", "/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Тест", phone: "+7 (771) 256-66-91", car: "Toyota Camry", date: "2026-09-17", time: "12:00", issue: "Диагностика подвески", website: "spam.example" }) });
  await hit("telegram?", "/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Тест", phone: "+7 (771) 256-66-91", car: "Toyota Camry", date: "2026-09-17", time: "12:00", issue: "Диагностика подвески" }) });
  await hit("index    ", "/");
  await hit("spa      ", "/anything");
  await hit("robots   ", "/robots.txt");
  await hit("sitemap  ", "/sitemap.xml");
  await hit("webp     ", "/assets/facade-640.webp");
  await hit("icon     ", "/assets/apple-touch-icon.png");
} finally {
  child.kill();
  await wait(300);
  console.log("--- server log ---");
  console.log(serverLog.trim());
}
