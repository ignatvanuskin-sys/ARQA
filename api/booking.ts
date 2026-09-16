import { bookingSchema, normalizePhone } from "../shared/booking";
import type { VercelRequest, VercelResponse } from "./types";
import { bookingMessage, sendBookingToTelegram, telegramConfigured } from "../server/telegram";

/**
 * Simple in-memory rate limiter. On serverless it is per-instance, so treat
 * it as a courtesy guard — persistent abuse limits belong at the platform
 * level (Vercel WAF / firewall rules).
 */
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Метод не поддерживается" });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "Слишком много заявок. Позвоните нам: +7 771 256 66 91" });
    return;
  }

  // Honeypot: silently accept-and-drop so bots do not retry.
  const website = (req.body as { website?: unknown } | undefined)?.website;
  if (typeof website === "string" && website.trim() !== "") {
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
}
