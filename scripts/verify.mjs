// Verification suite (stage 2, part A): sticky CTA, e2e form with a mocked
// Telegram API, rate limit, honeypot, axe scan, meta tags.
// Spawns the production server itself; no external services needed.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";

const SHOTS = "verification";
fs.mkdirSync(SHOTS, { recursive: true });

// --- mock Telegram API ---
const received = [];
const mock = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    received.push({ url: req.url, body: JSON.parse(body || "{}") });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, result: { message_id: 1 } }));
  });
});
await new Promise((r) => mock.listen(3181, r));

// --- production server ---
const server = spawn(process.execPath, ["dist/index.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3180",
    TELEGRAM_API_URL: "http://localhost:3181",
    TELEGRAM_BOT_TOKEN: "TEST:TOKEN",
    TELEGRAM_CHAT_ID: "TESTCHAT",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
await new Promise((r) => setTimeout(r, 1200));

const BASE = "http://localhost:3180";
const results = [];
const check = (id, ok, detail) => {
  results.push({ id, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${id} — ${detail}`);
};

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  // ---------- A0: boot-hero visual continuity ----------
  const page0 = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page0.goto(BASE, { waitUntil: "commit" });
  await page0.waitForTimeout(250);
  await page0.screenshot({ path: `${SHOTS}/a0-boot-hero.png` });
  await page0.waitForSelector(".hero", { timeout: 10000 });
  await page0.waitForTimeout(600);
  await page0.screenshot({ path: `${SHOTS}/a0-after-mount.png` });
  const bootGone = await page0.evaluate(() => {
    const el = document.querySelector(".boot-hero");
    return !el || getComputedStyle(el).display === "none";
  });
  check("A0 boot-hero swap", bootGone, `boot-hero hidden after mount: ${bootGone}`);
  await page0.close();

  // ---------- A1: sticky CTA on mobile viewports ----------
  for (const [w, h] of [[375, 812], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(400);
    const bar = page.locator(".mobile-bar");
    const visible = await bar.isVisible();
    const cls = await bar.getAttribute("class");
    const barBox = await bar.boundingBox();
    // what's actually on top at the center of each button?
    const topAtButtons = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".mobile-bar a")];
      return els.map((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return el.contains(top) || top === el ? "self" : (top?.className || "").toString().slice(0, 60);
      });
    });
    // safe-area: computed padding-bottom of the bar
    const padBottom = await page.evaluate(() => getComputedStyle(document.querySelector(".mobile-bar")).paddingBottom);
    await page.screenshot({ path: `${SHOTS}/a1-sticky-cta-${w}x${h}.png`, fullPage: false });
    check(`A1 ${w}x${h}`, visible && cls.includes("is-visible") && topAtButtons.every((t) => t === "self"),
      `visible=${visible}, class=${cls}, elementFromPoint=[${topAtButtons.join(" | ")}], padding-bottom=${padBottom}, barBottom=${barBox ? Math.round(barBox.y + barBox.height) : "n/a"}/viewport=${h}`);
    await page.close();
  }

  // safe-area CSS presence
  const css = fs.readFileSync("client/src/index.css", "utf-8");
  const hasSafeArea = /safe-area-inset-bottom|env\(/.test(css);
  const cssHasSafeArea = css.includes("safe-area-inset-bottom");
  check("A1 safe-area", cssHasSafeArea, cssHasSafeArea ? "index.css uses env(safe-area-inset-bottom)" : "NO safe-area rule found in index.css");

  // ---------- A2: e2e form submission with special chars ----------
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page2.goto(BASE + "/#booking", { waitUntil: "networkidle" });
  const injection = '<b>XSS</b> & "quotes" > here';
  await page2.fill('.contact-form input[name="name"], .contact-form label:has-text("обращаться") input', "Тест <script>alert(1)</script>");
  await page2.fill('.contact-form input[type="tel"]', "9261234567");
  await page2.fill('.contact-form label:has-text("Автомобиль") input', `Toyota <b>${injection}</b>`);
  await page2.fill('.contact-form input[type="date"]', "2026-09-20");
  await page2.fill('.contact-form input[type="time"]', "14:30");
  await page2.fill(".contact-form textarea", `Шум в подвеске ${injection}`);
  await page2.click('.contact-form button[type="submit"]');
  await page2.waitForSelector(".form-success-block", { timeout: 8000 });
  const successText = await page2.textContent(".form-success-block");
  check("A2 UI", successText.includes("Заявка получена"), `success block: "${successText.slice(0, 60).trim()}..."`);
  await page2.screenshot({ path: `${SHOTS}/a2-form-success.png` });

  // mock received exactly one message with escaped HTML
  await new Promise((r) => setTimeout(r, 300));
  const msg = received[received.length - 1];
  const text = msg?.body?.text ?? "";
  const escaped = !text.includes("<script>") && !text.includes("<b>XSS</b>") && text.includes("&lt;script&gt;") && text.includes("&amp;");
  const parseModeOk = msg?.body?.parse_mode === "HTML" && msg?.body?.chat_id === "TESTCHAT";
  const urlOk = /\/botTEST:TOKEN\/sendMessage$/.test(msg?.url ?? "");
  check("A2 telegram", received.length === 1 && escaped && parseModeOk && urlOk,
    `calls=${received.length}, url=${msg?.url}, chat=${msg?.body?.chat_id}, escaped=${escaped}`);
  fs.writeFileSync(`${SHOTS}/a2-telegram-message.txt`, text);
  await page2.close();

  // ---------- A3: rate limit + honeypot ----------
  // NOTE: the A2 UI submission already consumed 1 of 10 slots for the default IP,
  // so 10 more requests => 9x200, then the 11th cumulative request gets 429.
  const post = (payload, ip) =>
    fetch(`${BASE}/api/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ip ? { "X-Forwarded-For": ip } : {}) },
      body: JSON.stringify(payload),
    });
  const payload = { name: "RL", phone: "+7 (926) 123-45-67", car: "Test", date: "2026-09-20", time: "10:00", issue: "тест лимита" };
  const codes = [];
  for (let i = 0; i < 11; i++) codes.push((await post(payload)).status);
  const okCount = codes.filter((c) => c === 200).length;
  check("A3 rate-limit", okCount === 9 && codes[10] === 429,
    `11 requests (1 slot used by A2) => ${codes.join(",")} — 429 returned on the 11th cumulative request`);
  const before = received.length;
  const hp = await post({ ...payload, website: "http://spam.example" }, "9.9.9.9");
  check("A3 honeypot", hp.status === 200 && received.length === before, `status=${hp.status}, telegramCallsDelta=${received.length - before}`);

  // ---------- A6: axe-core scan ----------
  const page3 = await browser.newPage({ viewport: { width: 375, height: 812 }, bypassCSP: true });
  await page3.goto(BASE, { waitUntil: "networkidle" });
  await page3.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const axe = await page3.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ["violations"] });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
  });
  // muted text contrast
  const mutedContrast = await page3.evaluate(() => {
    function lum(c) {
      const [r, g, b] = c.match(/\d+(\.\d+)?/g).map(Number).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function ratio(fg, bg) {
      const l1 = lum(fg), l2 = lum(bg);
      return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
    }
    const el = document.querySelector(".form-note, .faq-answer p, .heading-note p");
    if (!el) return "no element";
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor, ratio: ratio(cs.color, cs.backgroundColor), fontSize: cs.fontSize };
  });
  check("A6 axe", axe.length === 0, axe.length ? `violations: ${JSON.stringify(axe)}` : "0 violations");
  check("A6 muted contrast", Number(mutedContrast.ratio) >= 4.5, JSON.stringify(mutedContrast));
  await page3.screenshot({ path: `${SHOTS}/a6-mobile-full.png`, fullPage: true });
  await page3.close();

  // ---------- A4: map block / route link ----------
  const page4 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page4.goto(BASE, { waitUntil: "networkidle" });
  const route = page4.locator('a:has-text("Построить маршрут")');
  await route.scrollIntoViewIfNeeded();
  await page4.waitForTimeout(300);
  const routeInfo = await page4.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Построить маршрут"));
    const deco = document.querySelector(".location-map");
    if (!link || !deco) return null;
    const ls = getComputedStyle(link);
    const lr = link.getBoundingClientRect();
    const dr = deco.getBoundingClientRect();
    return {
      linkVisible: lr.width > 0 && lr.height > 0,
      linkFont: ls.fontSize, linkWeight: ls.fontWeight, linkColor: ls.color,
      linkArea: Math.round(lr.width * lr.height),
      decoArea: Math.round(dr.width * dr.height),
      onScreen: lr.top >= 0 && lr.bottom <= innerHeight,
    };
  });
  await page4.locator(".location-section").scrollIntoViewIfNeeded();
  await page4.waitForTimeout(300);
  await page4.screenshot({ path: `${SHOTS}/a4-location.png` });
  check("A4 route link", Boolean(routeInfo?.linkVisible), JSON.stringify(routeInfo));
  await page4.close();

  // ---------- A7: meta tags in served HTML ----------
  const served = await (await fetch(BASE + "/")).text();
  const canonical = served.match(/<link rel="canonical"[^>]*>/)?.[0];
  const ogImage = served.match(/<meta property="og:image"[^>]*>/)?.[0];
  check("A7 meta", Boolean(canonical && ogImage), `${canonical} | ${ogImage}`);
} finally {
  await browser.close();
  server.kill();
  mock.close();
  await new Promise((r) => setTimeout(r, 300));
  fs.writeFileSync(`${SHOTS}/server.log`, serverLog);
}

console.log("\nSUMMARY: " + (results.every((r) => r.ok) ? "ALL PASS" : "HAS FAILURES"));
