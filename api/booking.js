const phonePattern = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

function clean(value) { return typeof value === "string" ? value.trim() : ""; }
function escapeHtml(value) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function message(b) {
  const visit = b.date && b.time ? `${b.date} в ${b.time}` : "время уточнить звонком";
  return ["🛠 <b>Новая заявка с сайта Arqa</b>", "", `👤 <b>Имя:</b> ${escapeHtml(b.name)}`, `📞 <b>Телефон:</b> ${escapeHtml(b.phone)}`, `🚗 <b>Авто:</b> ${escapeHtml(b.car)}`, `📅 <b>Визит:</b> ${escapeHtml(visit)}`, `🔧 <b>Проблема:</b> ${escapeHtml(b.issue)}`].join("\n");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Метод не поддерживается" });

  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch { return res.status(400).json({ error: "Некорректные данные формы" }); } }
  if (clean(body.website)) return res.status(200).json({ ok: true });

  const booking = { name: clean(body.name), phone: clean(body.phone), car: clean(body.car), date: clean(body.date), time: clean(body.time), issue: clean(body.issue) };
  if (booking.name.length < 2 || booking.name.length > 80) return res.status(400).json({ error: "Укажите имя (минимум 2 символа)" });
  if (!phonePattern.test(booking.phone)) return res.status(400).json({ error: "Введите телефон в формате +7 (XXX) XXX-XX-XX" });
  if (booking.car.length < 2 || booking.car.length > 100) return res.status(400).json({ error: "Укажите марку и модель" });
  if (booking.date && !datePattern.test(booking.date)) return res.status(400).json({ error: "Выберите дату в корректном формате" });
  if (booking.time && !timePattern.test(booking.time)) return res.status(400).json({ error: "Выберите время в корректном формате" });
  if (booking.issue.length < 5 || booking.issue.length > 2000) return res.status(400).json({ error: "Опишите, что нужно сделать" });

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log("Demo booking accepted", { name: booking.name, phone: booking.phone, car: booking.car, date: booking.date, time: booking.time });
    return res.status(200).json({ ok: true, demo: true });
  }
  try {
    const base = process.env.TELEGRAM_API_URL || "https://api.telegram.org";
    const response = await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message(booking), parse_mode: "HTML", disable_web_page_preview: true }) });
    if (!response.ok) throw new Error(`Telegram API responded ${response.status}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to deliver booking", error);
    return res.status(502).json({ error: "Не удалось отправить заявку в Telegram. Позвоните владельцу: +7 771 256 66 91" });
  }
}
