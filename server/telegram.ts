import type { BookingInput } from "../shared/booking";

const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || "https://api.telegram.org";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function bookingMessage(booking: Omit<BookingInput, "website">) {
  const { name, phone, car, date, time, issue } = booking;
  const when = [date, time].filter(Boolean).join(" в ");
  return [
    "🛠 <b>Новая заявка с сайта Arqa</b>",
    "",
    `👤 <b>Имя:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    `🚗 <b>Авто:</b> ${escapeHtml(car)}`,
    ...(when ? [`📅 <b>Желаемое время:</b> ${escapeHtml(when)}`] : []),
    `🔧 <b>Проблема:</b> ${escapeHtml(issue)}`,
  ].join("\n");
}

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Sends the booking to the owner. Throws on delivery failure. */
export async function sendBookingToTelegram(text: string) {
  const url = `${TELEGRAM_API_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Telegram API responded ${response.status}`);
  }
}
