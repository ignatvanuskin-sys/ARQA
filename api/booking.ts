import { bookingSchema } from "../shared/booking";
import { bookingMessage, sendBookingToTelegram, telegramConfigured } from "../server/telegram";

export default async function bookingHandler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Метод не поддерживается" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (typeof body.website === "string" && body.website.trim() !== "") {
    res.status(200).json({ ok: true });
    return;
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Проверьте заполнение формы" });
    return;
  }

  if (!telegramConfigured()) {
    res.status(503).json({ error: "Приём заявок временно не настроен. Позвоните владельцу: +7 771 256 66 91" });
    return;
  }

  try {
    const { website: _website, ...booking } = parsed.data;
    await sendBookingToTelegram(bookingMessage(booking));
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to deliver booking:", error);
    res.status(502).json({ error: "Не удалось отправить заявку в Telegram. Позвоните владельцу: +7 771 256 66 91" });
  }
}
