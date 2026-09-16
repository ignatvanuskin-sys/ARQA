// Full Lighthouse run (all categories) against the local production server.
import { spawn } from "node:child_process";

const server = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, NODE_ENV: "production", PORT: "3184" },
  stdio: ["ignore", "ignore", "pipe"],
});
server.stderr.on("data", (d) => process.stderr.write(d));
await new Promise((r) => setTimeout(r, 1200));

const lh = spawn("npx.cmd", [
  "lighthouse",
  "http://localhost:3184",
  "--form-factor=mobile",
  "--screenEmulation.mobile",
  `--chrome-flags="--headless=new"`,
  "--output=json",
  "--output-path=verification/lighthouse-full.json",
  "--quiet",
], { shell: true, stdio: ["ignore", "pipe", "pipe"] });
lh.stderr.on("data", (d) => process.stderr.write(d));
lh.on("close", (code) => {
  console.log(`lighthouse exit: ${code}`);
  server.kill();
  setTimeout(() => process.exit(0), 500);
});
