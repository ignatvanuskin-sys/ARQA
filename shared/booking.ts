import { z } from "zod";

/**
 * Booking form contract shared by the client form and the Express API.
 * The honeypot field `website` must stay empty — bots fill it.
 */
export const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Укажите имя (минимум 2 символа)")
    .max(80, "Слишком длинное имя"),
  phone: z
    .string()
    .trim()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "Введите телефон в формате +7 (XXX) XXX-XX-XX"),
  car: z
    .string()
    .trim()
    .min(2, "Укажите марку и модель")
    .max(100, "Слишком длинное название"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату").optional().or(z.literal("")),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Выберите время").optional().or(z.literal("")),
  issue: z
    .string()
    .trim()
    .min(5, "Опишите, что нужно сделать")
    .max(2000, "Описание слишком длинное"),
  // Honeypot: clients keep it empty; the server silently drops filled values,
  // so no strict validation here — any string is accepted and discarded.
  website: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

/** Reduces the masked phone to +7XXXXXXXXXX for storage/messaging. */
export function normalizePhone(masked: string): string {
  const digits = masked.replace(/\D/g, "");
  return `+7${digits.slice(1, 11)}`;
}
