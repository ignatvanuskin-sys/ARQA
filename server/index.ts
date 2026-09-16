import { bookingSchema, normalizePhone } from "@shared/booking";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { bookingMessage, sendBookingToTelegram, telegramConfigured } from "./telegram";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
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
    // Honeypot: silently accept-and-drop so bots do not retry. Checked before
    // validation on purpose — no error, no Telegram message.
    if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
      res.json({ ok: true });
      return;
    }

    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      res.status(400).json({ error: first?.message ?? "Проверьте заполнение формы" });
      return;
    }

    const { website: _website, phone, ...booking } = parsed.data;

    if (!telegramConfigured()) {
      console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not configured — booking dropped");
      res.status(503).json({
        error: "Приём заявок временно не настроен. Позвоните нам: +7 771 256 66 91",
      });
      return;
    }

    try {
      await sendBookingToTelegram(bookingMessage({ ...booking, phone }));
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
        // Never cache the HTML shell.
        if (filePath.endsWith(".html")) {
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
