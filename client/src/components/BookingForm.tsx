import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@shared/booking";
import { CalendarDays, Check, Loader2, Phone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PHONE, PHONE_HREF } from "@/lib/contacts";

/** Formats raw digits as +7 (XXX) XXX-XX-XX while typing. */
function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits && !digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);
  const a = digits.slice(1, 4);
  const b = digits.slice(4, 7);
  const c = digits.slice(7, 9);
  const d = digits.slice(9, 11);
  let out = "+7";
  if (a) out += ` (${a}`;
  if (a.length === 3) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (d) out += `-${d}`;
  return out;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Status = "idle" | "sending" | "success" | "error";

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: "", phone: "", car: "", date: "", time: "", issue: "", website: "" },
    // The honeypot must never trigger client-side validation errors.
    // Filled honeypots are dropped silently on the server.
  });

  async function onSubmit(values: BookingInput) {
    setStatus("sending");
    setServerError(null);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.");
      }
      setStatus("success");
      reset();
    } catch (error) {
      setStatus("error");
      setServerError(error instanceof Error ? error.message : "Что-то пошло не так. Попробуйте ещё раз.");
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form" role="status">
        <div className="form-heading">
          <span>Заявка отправлена</span>
          <span className="form-badge">Готово</span>
        </div>
        <div className="form-success form-success-block">
          <p>
            <Check size={15} /> Спасибо! Заявка получена — перезвоним в рабочее время (10:00–22:00), чтобы подтвердить запись.
          </p>
          <a className="form-call-link" href={PHONE_HREF}>
            <Phone size={15} /> Не хотите ждать? {PHONE}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-heading">
        <span>Заявка на запись</span>
        <span className="form-badge">2 минуты</span>
      </div>

      <label>
        Как к вам обращаться?
        <input type="text" placeholder="Ваше имя" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
      </label>

      <label>
        Телефон
        <input
          type="tel"
          inputMode="tel"
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          {...register("phone", {
            onChange: (event) => setValue("phone", formatPhone(event.target.value), { shouldValidate: false }),
          })}
        />
        {errors.phone && <span className="form-error">{errors.phone.message}</span>}
      </label>

      <label>
        Автомобиль
        <input type="text" placeholder="Марка и модель" aria-invalid={Boolean(errors.car)} {...register("car")} />
        {errors.car && <span className="form-error">{errors.car.message}</span>}
      </label>

      <div className="form-two">
        <label>
          Дата
          <input type="date" min={todayIso()} aria-invalid={Boolean(errors.date)} {...register("date")} />
          {errors.date && <span className="form-error">{errors.date.message}</span>}
        </label>
        <label>
          Время
          <input type="time" aria-invalid={Boolean(errors.time)} {...register("time")} />
          {errors.time && <span className="form-error">{errors.time.message}</span>}
        </label>
      </div>

      <label>
        Что нужно сделать?
        <textarea
          rows={3}
          placeholder="Например: диагностика, замена масла, шум в подвеске"
          aria-invalid={Boolean(errors.issue)}
          {...register("issue")}
        />
        {errors.issue && <span className="form-error">{errors.issue.message}</span>}
      </label>

      {/* Honeypot: hidden from humans, bots fill it and get silently dropped. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Сайт
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <button className="button button-yellow form-button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? (
          <>
            <Loader2 className="form-spinner" size={18} /> Отправляем…
          </>
        ) : (
          <>
            <CalendarDays size={18} /> Записаться
          </>
        )}
      </button>

      {status === "error" && serverError && (
        <div className="form-error-block" role="alert">
          {serverError}
        </div>
      )}

      <p className="form-note">Нажимая «Записаться», вы соглашаетесь на обработку указанных данных для связи по заявке.</p>
    </form>
  );
}
