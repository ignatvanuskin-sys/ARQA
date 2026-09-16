import { normalizePhone, bookingSchema } from "@shared/booking";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sendTelegramMessage(text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

function bookingMessage(booking: Record<string, string>) {
  const { name, phone, car, date, time, issue } = booking;
  return [
    "🛠 <b>Новая заявка с сайта Arqa</b>",
    "",
    `👤 <b>Имя:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    `🚗 <b>Авто:</b> ${escapeHtml(car)}`,
    `📅 <b>Дата:</b> ${escapeHtml(date)} в ${escapeHtml(time)}`,
    `🔧 <b>Проблема:</b> ${escapeHtml(issue)}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function startServer() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:"],
          mediaSrc: ["'self'"],
          connectSrc: ["'self'", "https:"],
          frameAncestors: ["'self'"],
        },
      },
    }),
  );

  // Same-origin by default; set ORIGIN=https://example.com to allow a cross-origin frontend.
  const allowedOrigin = process.env.ORIGIN;
  app.use(cors(allowedOrigin ? { origin: allowedOrigin } : { origin: false }));

  app.use(express.json({ limit: "16kb" }));

  const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Слишком много заявок. Позвоните нам: +7 771 256 66 91" },
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  app.post("/api/booking", bookingLimiter, async (req, res) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      res.status(400).json({ error: first?.message ?? "Проверьте заполнение формы" });
      return;
    }

    const { website, phone, ...booking } = parsed.data;
    if (website) {
      // Honeypot filled — pretend success so bots do not retry.
      res.json({ ok: true });
      return;
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not configured — booking dropped");
      res.status(503).json({
        error: "Приём заявок временно не настроен. Позвоните нам: +7 771 256 66 91",
      });
      return;
    }

    try {
      const response = await sendTelegramMessage(bookingMessage({ ...booking, phone }));
      if (!response.ok) {
        throw new Error(`Telegram API responded ${response.status}`);
      }
      console.log(`Booking accepted: ${normalizePhone(phone)} (${booking.car}, ${booking.date} ${booking.time})`);
      res.json({ ok: true });
    } catch (error) {
      console.error("Failed to deliver booking:", error);
      res.status(502).json({
        error: "Не удалось отправить заявку. Позвоните нам: +7 771 256 66 91",
      });
    }
  });

  // Serve static files from dist/public in production
  const staticPath = isProduction
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  app.use(
    express.static(staticPath, {
      maxAge: "30d",
      setHeaders(res, filePath) {
        // Never cache the HTML shell or service endpoints.
        if (filePath.endsWith(".html") || filePath.startsWith(path.join(staticPath, "api"))) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const server = createServer(app);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/ (${isProduction ? "production" : "development"})`);
  });

  function shutdown(signal: string) {
    console.log(`${signal} received — closing server...`);
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
    // Force-exit if connections do not drain in time.
    setTimeout(() => process.exit(0), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
