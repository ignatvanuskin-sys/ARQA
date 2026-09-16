import { lazy, ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { INSTAGRAM_HREF, PHONE, PHONE_HREF, TWO_GIS_HREF, WHATSAPP_HREF } from "@/lib/contacts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Gauge,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
  X,
  ZoomIn,
  Zap,
} from "lucide-react";

const CameraIcon = () => <Camera size={21} />;
const ArqaLightbox = lazy(() => import("@/components/ArqaLightbox"));
const BookingForm = lazy(() => import("@/components/BookingForm"));

const LOGO_LIGHT = "/assets/logo-light.webp";
const LOGO_DARK = "/assets/logo-dark.webp";
const HERO_IMAGE = "/assets/facade-960.webp";
const HERO_VIDEO = "/assets/hero.mp4";
const GALLERY_SIZES = "(min-width: 1024px) 30vw, 92vw";

type GalleryImage = {
  base: string;
  full: string;
  width: number;
  height: number;
  title: string;
  label: string;
  alt: string;
};

const galleryImages: GalleryImage[] = [
  {
    base: "facade",
    full: "/assets/facade-1280.jpg",
    width: 1440,
    height: 1080,
    title: "01 / ФАСАД",
    label: "Фасад и въезд Arqa",
    alt: "Фасад и въезд автосервиса Arqa, фото из 2GIS",
  },
  {
    base: "building",
    full: "/assets/building-1280.jpg",
    width: 1440,
    height: 648,
    title: "02 / ЗДАНИЕ",
    label: "Здание автосервиса",
    alt: "Здание автосервиса Arqa, фото из 2GIS",
  },
  {
    base: "work",
    full: "/assets/work-1280.jpg",
    width: 1440,
    height: 1080,
    title: "03 / РАБОТА",
    label: "Фото из галереи посетителей",
    alt: "Фотография из галереи посетителей Arqa в 2GIS",
  },
];

function Photo({ base, alt, sizes, width, height, eager }: { base: string; alt: string; sizes: string; width: number; height: number; eager?: boolean }) {
  const widths = [640, 960, 1280];
  const webpSet = widths.map((w) => `/assets/${base}-${w}.webp ${w}w`).join(", ");
  const jpgSet = widths.map((w) => `/assets/${base}-${w}.jpg ${w}w`).join(", ");
  return (
    <picture>
      <source type="image/webp" srcSet={webpSet} sizes={sizes} />
      <img
        src={`/assets/${base}-1280.jpg`}
        srcSet={jpgSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );
}

type Service = {
  title: string;
  description: string;
  icon: ReactNode;
  accent: string;
};

const services: Service[] = [
  {
    title: "Компьютерная диагностика",
    description: "Электронные системы авто и поиск причин неисправности.",
    icon: <Gauge size={24} strokeWidth={1.8} />,
    accent: "yellow",
  },
  {
    title: "Ходовая часть",
    description: "Ремонт и обслуживание узлов подвески и тормозной системы.",
    icon: <CarFront size={24} strokeWidth={1.8} />,
    accent: "red",
  },
  {
    title: "Двигатель",
    description: "Работа с бензиновыми и дизельными двигателями.",
    icon: <Wrench size={24} strokeWidth={1.8} />,
    accent: "wood",
  },
  {
    title: "Стартеры и генераторы",
    description: "Диагностика и ремонт узлов запуска и зарядки автомобиля.",
    icon: <Zap size={24} strokeWidth={1.8} />,
    accent: "yellow",
  },
  {
    title: "Климатические системы",
    description: "Обслуживание автомобильных систем климат-контроля.",
    icon: <ShieldCheck size={24} strokeWidth={1.8} />,
    accent: "red",
  },
  {
    title: "Масла и автохимия",
    description: "Автомасла, автохимия и другие направления обслуживания.",
    icon: <BadgeCheck size={24} strokeWidth={1.8} />,
    accent: "wood",
  },
];

const faq = [
  {
    question: "Какие автомобили принимаете?",
    answer:
      "Arqa работает с легковыми автомобилями. Отдельно в карточке 2GIS отмечен тег Audi. Возможность работ с конкретной маркой и моделью лучше уточнить до визита.",
  },
  {
    question: "Как узнать стоимость ремонта?",
    answer:
      "Публичного прайс-листа в 2GIS нет. Опишите проблему по телефону или в WhatsApp — так команда сможет сориентироваться по следующему шагу и уточнить стоимость после диагностики, если она потребуется.",
  },
  {
    question: "Как записаться?",
    answer:
      "Самый короткий путь — позвонить по номеру +7 771 256 66 91 или написать в WhatsApp. Сообщите марку, модель и кратко опишите проблему.",
  },
  {
    question: "Есть ли гарантия на работы?",
    answer:
      "Условия гарантии в открытых источниках не подтверждены. Уточните их у владельца или мастера до начала работ.",
  },
  {
    question: "Как добраться?",
    answer:
      "Адрес: Кокшетау, улица Шагалалы, 1/1. Ориентир — остановка «Нулевая дачная (по требованию)», около 450 м или 5 минут пешком по данным 2GIS.",
  },
  {
    question: "Какие способы оплаты доступны?",
    answer:
      "В карточке 2GIS указаны карта, наличный расчёт, перевод с карты и QR-код.",
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [rating, setRating] = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [lightbox, setLightbox] = useState<{ path: string; title: string; label: string } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobilePhoneVisible, setMobilePhoneVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 620px)").matches,
  );
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Hide the static boot-hero placeholder once the real hero is rendered.
  // Two rAFs guarantee the hero has actually painted first — otherwise the
  // video would re-register as a fresh LCP candidate.
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.querySelector(".boot-hero")?.classList.add("is-done");
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // The lightbox is a modal: stop the page behind it from scrolling on touch devices.
  useEffect(() => {
    if (!lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 620px)");
    const updateScreen = () => setIsSmallScreen(media.matches);
    updateScreen();
    media.addEventListener?.("change", updateScreen);
    return () => media.removeEventListener?.("change", updateScreen);
  }, []);

  // Close the mobile menu on Escape and whenever the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isSmallScreen) setMobileMenuOpen(false);
  }, [isSmallScreen]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(media.matches);
    updateMotionPreference();
    media.addEventListener?.("change", updateMotionPreference);
    return () => media.removeEventListener?.("change", updateMotionPreference);
  }, []);

  // `autoPlay` is only read at mount, so drive playback imperatively when the
  // preference resolves (or changes) afterwards. On small screens the video
  // never plays: with autoplay the browser downloads it even under
  // preload="none", wasting ~340 KB on mobile connections.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (reduceMotion || isSmallScreen) {
      video.pause();
    } else {
      void video.play().catch(() => {
        /* autoplay can be refused; the poster stays visible */
      });
    }
  }, [reduceMotion, isSmallScreen]);

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 420);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#top">Перейти к содержанию</a>
      <div className="topline">
        <div className="container topline-inner">
          <span><span className="status-dot" /> Ежедневно 10:00–22:00</span>
          <span className="topline-location">Кокшетау · ул. Шагалалы, 1/1</span>
          <div className="topline-actions">
            <a href={PHONE_HREF}>{PHONE}</a>
            <a className="topline-wa" href={WHATSAPP_HREF} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
          </div>
        </div>
      </div>

      <header className={`nav-wrap ${hasScrolled ? "is-following" : ""}`}>
        <nav className="container main-nav" aria-label="Основная навигация">
          <a className="brand" href="#top" aria-label="Arqa — в начало" data-light-logo={LOGO_LIGHT}>
            <img className="brand-logo" src={LOGO_DARK} alt="ARQA" width={164} height={58} />
            <span className="brand-sub">AUTO SERVICE</span>
          </a>
          <div className="nav-links">
            <a href="#services">Услуги</a>
            <a href="#trust">Почему Arqa</a>
            <a href="#booking">Запись</a>
          </div>
          <a className="nav-cta" href="#booking"><CalendarDays size={16} /> Записаться</a>
          <div className="mobile-nav-actions">
            {mobilePhoneVisible ? (
              <a className="mobile-phone is-visible" href={PHONE_HREF} aria-label={`Позвонить по номеру ${PHONE}`}>
                <Phone size={19} />
                <span>{PHONE}</span>
              </a>
            ) : (
              <button
                type="button"
                className="mobile-phone"
                onClick={() => setMobilePhoneVisible(true)}
                aria-label="Показать номер телефона"
              >
                <Phone size={19} />
              </button>
            )}
            <button type="button" className="mobile-menu-trigger" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-menu" aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}>
              {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </nav>
        {mobileMenuOpen && <>
          <div className="mobile-menu-scrim" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <div className="mobile-menu" id="mobile-menu">
            <nav aria-label="Мобильное меню">
              <a href="#services" onClick={() => setMobileMenuOpen(false)}>Услуги <ArrowUpRight size={16} /></a>
              <a href="#trust" onClick={() => setMobileMenuOpen(false)}>Почему Arqa <ArrowUpRight size={16} /></a>
              <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Фотографии <ArrowUpRight size={16} /></a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Цены и гарантия <ArrowUpRight size={16} /></a>
              <a href="#booking" onClick={() => setMobileMenuOpen(false)}>Записаться <CalendarDays size={16} /></a>
            </nav>
          </div>
        </>}
      </header>

      <main id="top" tabIndex={-1}>
        <section className="hero">
          <video
            className="hero-video"
            ref={heroVideoRef}
            autoPlay={!reduceMotion && !isSmallScreen}
            muted
            loop
            playsInline
            preload={isSmallScreen ? "none" : "metadata"}
            poster={HERO_IMAGE}
            onPlaying={() => heroVideoRef.current?.classList.add("is-playing")}
            onError={() => heroVideoRef.current?.classList.remove("is-playing")}
            aria-label="Атмосфера автосервиса Arqa"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className="hero-overlay" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="eyebrow light"><span className="eyebrow-line" /> Автосервис в Кокшетау</div>
              <h1>Чтобы машина<br /><em>ехала уверенно.</em></h1>
              <p className="hero-lead">Диагностика и ремонт легковых автомобилей. Ежедневно с 10:00 до 22:00.</p>
              <div className="hero-actions">
                <a className="button button-yellow" href="#booking"><CalendarDays size={18} /> Записаться</a>
              </div>
              <div className="hero-meta">
                <span><MapPin size={15} /> ул. Шагалалы, 1/1</span>
                <span><Clock3 size={15} /> Без выходных</span>
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-side-label">ARQA / 2025</div>
              <div className="hero-side-copy">Точный сервис<br />для живых дорог.</div>
              <div className="hero-side-bottom"><span>01</span><span className="hero-side-rule" /><span>Кокшетау</span></div>
            </div>
          </div>
          <button className="scroll-cue" onClick={() => scrollToId("services")} aria-label="Перейти к услугам"><span>Листать</span><ArrowDownRight size={20} /></button>
        </section>

        <section className="trust-strip" id="trust">
          <div className="container trust-grid">
            <div className="trust-intro"><span className="eyebrow">Факты вместо обещаний</span><strong>Сервис, который<br /><span>на связи.</span></strong></div>
            <div className="trust-stat"><strong>4,4<span>/5</span></strong><span>рейтинг в 2GIS</span></div>
            <div className="trust-stat"><strong>64</strong><span>оценки клиентов</span></div>
            <div className="trust-stat"><strong>23</strong><span>отзыва в 2GIS</span></div>
            <div className="trust-stat"><strong>12<span>ч</span></strong><span>работаем ежедневно</span></div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow">Что делаем</span><h2>От сигнала на панели<br /><span>до уверенной поездки.</span></h2></div>
              <div className="heading-note"><span className="note-index">01</span><p>В карточке Arqa подтверждены направления ремонта, диагностики и обслуживания. Стоимость уточняется после описания проблемы.</p></div>
            </div>
            <div className="services-layout">
              <div className="service-aside">
                <div className="aside-number">06</div>
                <p>направлений,<br />чтобы начать<br /><strong>с одного сообщения.</strong></p>
                <a className="text-link" href="#booking">Выбрать время записи <ArrowUpRight size={15} /></a>
              </div>
              <div className="services-grid">
                {services.map((service, index) => (
                  <article className={`service-card service-${service.accent}`} key={service.title}>
                    <div className="service-top"><span className="service-number">0{index + 1}</span><span className="service-icon">{service.icon}</span></div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <span className="service-link">Подробнее при записи <ArrowUpRight size={15} /></span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section dark-section why-section">
          <div className="container">
            <div className="section-heading dark-heading split-heading">
              <div><span className="eyebrow light">Важные детали</span><h2>Не громче.<br /><span>Понятнее.</span></h2></div>
              <div className="heading-note"><span className="note-index">02</span><p>Мы собрали то, что подтверждено открытой карточкой и отзывами. Без рекламного шума и неподтверждённых гарантий.</p></div>
            </div>
            <div className="why-grid">
              <article className="why-card why-card-large"><div className="why-number">01</div><div><h3>До 22:00<br />каждый день</h3><p>Можно обратиться после работы — график Arqa рассчитан на обычный ритм города.</p></div><Clock3 className="why-icon" size={42} strokeWidth={1.2} /></article>
              <article className="why-card"><div className="why-number">02</div><h3>Тёплый бокс</h3><p>В карточке 2GIS отдельно отмечена аренда тёплого бокса.</p><div className="why-mini-mark">ARQA</div></article>
              <article className="why-card"><div className="why-number">03</div><h3>Оплата без лишних вопросов</h3><p>Карта, наличные, перевод с карты и QR-код.</p><div className="payment-pills"><span>₸</span><span>QR</span><span>•••</span></div></article>
              <article className="why-card why-card-wide"><div className="why-number">04</div><div><h3>Сначала — диалог</h3><p>Опишите проблему в WhatsApp, уточните возможность и стоимость, затем договоритесь о визите. Это рекомендуемый сценарий обращения, а не обещание регламента.</p></div><MessageCircle className="why-icon" size={42} strokeWidth={1.2} /></article>
            </div>
          </div>
        </section>

        <section className="section gallery-section" id="gallery">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow">Живое место</span><h2>Так выглядит<br /><span>Arqa.</span></h2></div>
              <div className="heading-note"><span className="note-index">02A</span><p>Реальные фотографии фасада, здания и работ взяты из публичной галереи Arqa в 2GIS. В карточке опубликовано 13 снимков.</p></div>
            </div>
            <div className="gallery-grid">
              <button type="button" className="gallery-card gallery-main gallery-photo-card" onClick={() => setLightbox({ path: galleryImages[0].full, title: galleryImages[0].title, label: galleryImages[0].label })}>
                <Photo base={galleryImages[0].base} alt={galleryImages[0].alt} sizes={GALLERY_SIZES} width={galleryImages[0].width} height={galleryImages[0].height} /><div className="gallery-photo-overlay"><span className="gallery-code">{galleryImages[0].title}</span><strong>{galleryImages[0].label}</strong><small><ZoomIn size={13} /> Увеличить фото</small></div>
              </button>
              <button type="button" className="gallery-card gallery-box gallery-photo-card" onClick={() => setLightbox({ path: galleryImages[1].full, title: galleryImages[1].title, label: galleryImages[1].label })}>
                <Photo base={galleryImages[1].base} alt={galleryImages[1].alt} sizes={GALLERY_SIZES} width={galleryImages[1].width} height={galleryImages[1].height} /><div className="gallery-photo-overlay"><span className="gallery-code">{galleryImages[1].title}</span><strong>{galleryImages[1].label}</strong><small><ZoomIn size={13} /> Увеличить фото</small></div>
              </button>
              <button type="button" className="gallery-card gallery-work gallery-photo-card" onClick={() => setLightbox({ path: galleryImages[2].full, title: galleryImages[2].title, label: galleryImages[2].label })}>
                <Photo base={galleryImages[2].base} alt={galleryImages[2].alt} sizes={GALLERY_SIZES} width={galleryImages[2].width} height={galleryImages[2].height} /><div className="gallery-photo-overlay"><span className="gallery-code">{galleryImages[2].title}</span><strong>{galleryImages[2].label}</strong><small><ZoomIn size={13} /> Увеличить фото</small></div>
              </button>
              <div className="gallery-note"><CameraIcon /><p><strong>Реальные фото из 2GIS.</strong><br />Всего в карточке опубликовано 13 снимков.</p></div>
            </div>
          </div>
        </section>

        <section className="section pricing-section" id="pricing">
          <div className="container pricing-layout">
            <div><span className="eyebrow">Прозрачные условия</span><h2>Перед визитом<br /><span>знайте главное.</span></h2><p className="pricing-lead">Публичный прайс-лист и подтверждённые условия гарантии в открытых источниках не найдены. Поэтому ниже — честные ориентиры для уточнения, а не придуманные цены.</p><a className="text-link" href="#booking">Запросить расчёт при записи <ArrowUpRight size={15} /></a></div>
            <div className="price-table">
              <div className="price-row price-head"><span>Услуга / условие</span><span>Ориентир</span></div>
              <div className="price-row"><div><strong>Компьютерная диагностика</strong><small>Электронные системы автомобиля</small></div><b>уточняется</b></div>
              <div className="price-row"><div><strong>Диагностика ходовой</strong><small>Перед ремонтом — по согласованию</small></div><b>уточняется</b></div>
              <div className="price-row"><div><strong>Ремонт и обслуживание</strong><small>Ходовая, двигатель, электрика, климат</small></div><b>после осмотра</b></div>
              <div className="price-row"><div><strong>Гарантия на работы</strong><small>Срок, исключения и условия</small></div><b>уточняется</b></div>
              <div className="price-foot"><ShieldCheck size={18} /><span>Не начинайте работу без согласования объёма и стоимости. Финальные условия подтверждаются мастером до ремонта.</span></div>
            </div>
          </div>
        </section>

        <section className="section reviews-section">
          <div className="container reviews-layout">
            <div className="reviews-heading"><span className="eyebrow">Реальный контекст</span><h2>Что отмечают<br /><span>клиенты.</span></h2><div className="rating-lockup"><Star size={19} fill="currentColor" /><strong>4,4</strong><span>из 5 в 2GIS</span></div><a className="text-link" href={TWO_GIS_HREF} target="_blank" rel="noreferrer">Смотреть карточку 2GIS <ExternalLink size={15} /></a></div>
            <div className="reviews-content">
              <div className="review-highlight"><div className="quote-mark">“</div><p>В отзывах повторяются скорость, качество и понятные объяснения мастеров. Есть и критика по цене и коммуникации — это важный сигнал, который нельзя прятать.</p><div className="review-source"><span className="source-line" /> Сводка по 23 отзывам в 2GIS</div></div>
              <div className="review-columns"><div><h3><Check size={17} /> Сильные сигналы</h3><ul><li>Быстрая и качественная работа</li><li>Объясняют проблему и результат</li><li>Отзывчивость и вежливость</li><li>Ремонт ходовой, генератора, тормозов и других узлов</li></ul></div><div><h3 className="caution-title"><span>!</span> Что уточнить</h3><ul><li>Итоговую стоимость и объём работ</li><li>Кто отвечает за конкретный заказ</li><li>Сроки и условия гарантии</li><li>Возможность работы с вашей моделью</li></ul></div></div>
            </div>
          </div>
        </section>

        <section className="section client-reviews-section" id="client-reviews">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow">Отзывы клиентов</span><h2>Доверие<br /><span>в цифрах.</span></h2></div>
              <div className="heading-note"><span className="note-index">04</span><p>Рейтинг и темы собраны по открытой карточке Arqa в 2GIS. Имена и дословные цитаты не публикуем без подтверждённого источника.</p></div>
            </div>
            <div className="reviews-dashboard">
              <div className="rating-panel">
                <span className="rating-kicker">Открытый рейтинг 2GIS</span>
                <div className="rating-score"><strong>4,4</strong><span>/ 5</span></div>
                <div className="interactive-stars" onMouseLeave={() => setHoverRating(0)} role="group" aria-label="Оценить сервис от одного до пяти">
                  {[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} aria-label={`${star} звезд`} onMouseEnter={() => setHoverRating(star)} onFocus={() => setHoverRating(star)} onBlur={() => setHoverRating(0)} onClick={() => setRating(star)}><Star size={26} fill={(hoverRating || rating) >= star ? "currentColor" : "transparent"} /></button>)}
                </div>
                <p className="rating-feedback">{hoverRating ? `Вы выбрали ${hoverRating} из 5` : `Ваше впечатление: ${rating} из 5`}</p>
                <a className="text-link rating-source-link" href={TWO_GIS_HREF} target="_blank" rel="noreferrer">Читать отзывы в 2GIS <ExternalLink size={15} /></a>
              </div>
              <div className="review-cards">
                <article className="client-review-card"><div className="review-card-top"><span>01 / ПОВТОРЯЮЩАЯСЯ ТЕМА</span><div className="mini-stars"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div></div><h3>Быстро и качественно</h3><p>В отзывах клиенты часто отмечают скорость выполнения работ и качество результата.</p><small>Сводка по открытым отзывам · 2GIS</small></article>
                <article className="client-review-card client-review-card-accent"><div className="review-card-top"><span>02 / ПОВТОРЯЮЩАЯСЯ ТЕМА</span><Check size={18} /></div><h3>Объясняют проблему</h3><p>Клиенты упоминают понятные объяснения мастеров и отзывчивое общение по ремонту.</p><small>Сводка по открытым отзывам · 2GIS</small></article>
                <article className="client-review-card client-review-card-caution"><div className="review-card-top"><span>03 / ВАЖНО УТОЧНИТЬ</span><span className="caution-dot">!</span></div><h3>Стоимость согласуйте заранее</h3><p>Встречаются разные оценки цены — поэтому финальный объём и стоимость лучше подтвердить до начала работ.</p><small>Честный контекст для нового клиента · 2GIS</small></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section process-section">
          <div className="container">
            <div className="section-heading split-heading"><div><span className="eyebrow">Простой старт</span><h2>Три шага<br /><span>до сервиса.</span></h2></div><div className="heading-note"><span className="note-index">03</span><p>Короткий рекомендуемый сценарий обращения. Конкретные условия диагностики, сроков и сметы лучше подтвердить у владельца.</p></div></div>
            <div className="process-grid"><div className="process-step"><span>01</span><h3>Опишите проблему</h3><p>Напишите, что происходит, и укажите марку и модель автомобиля.</p><ArrowUpRight size={21} /></div><div className="process-step featured-step"><span>02</span><h3>Согласуйте детали</h3><p>Уточните возможность, стоимость и удобное время по телефону или в WhatsApp.</p><MessageCircle size={21} /></div><div className="process-step"><span>03</span><h3>Приезжайте в Arqa</h3><p>Кокшетау, улица Шагалалы, 1/1. Ориентир — остановка в 5 минутах.</p><Navigation size={21} /></div></div>
          </div>
        </section>

        <section className="section contact-section" id="booking">
          <div className="container contact-layout">
            <div className="contact-copy"><span className="eyebrow light">Запись на сервис</span><h2>Выберите<br /><em>удобное время.</em></h2><p>Заполните короткую форму: мы подготовим детали визита и подскажем следующий шаг.</p><div className="contact-phone"><Phone size={19} /><a href={PHONE_HREF}>{PHONE}</a></div><div className="contact-hours"><Clock3 size={16} /> Ежедневно · 10:00–22:00</div></div>
            <Suspense fallback={<form className="contact-form" aria-busy="true"><div className="form-heading"><span>Заявка на запись</span></div></form>}><BookingForm /></Suspense>
          </div>
        </section>

        <section className="section faq-section">
          <div className="container faq-layout"><div><span className="eyebrow">Без мелкого шрифта</span><h2>Частые<br /><span>вопросы.</span></h2><p className="faq-intro">Если ответа здесь нет, можно написать в WhatsApp — контакт всегда под рукой.</p><a className="text-link" href={WHATSAPP_HREF} target="_blank" rel="noreferrer">Задать вопрос <ArrowUpRight size={15} /></a></div><div className="faq-list">{faq.map((item, index) => <div className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={item.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span><b>0{index + 1}</b>{item.question}</span><ChevronDown size={19} /></button>{openFaq === index && <div className="faq-answer"><p>{item.answer}</p></div>}</div>)}</div></div>
        </section>

        <section className="location-section"><div className="container location-card"><div className="location-map" aria-hidden="true"><div className="map-grid" /><div className="map-pin"><MapPin size={22} fill="currentColor" /></div><div className="map-label">ARQA<br /><span>Шагалалы, 1/1</span></div></div><div className="location-info"><span className="eyebrow">Где нас найти</span><h2>Приезжайте<br /><span>в Arqa.</span></h2><div className="address-line"><MapPin size={19} /><div><strong>Кокшетау, ул. Шагалалы, 1/1</strong><span>Около 450 м от остановки «Нулевая дачная (по требованию)»</span></div></div><div className="location-actions"><a className="text-link" href="#booking">Записаться <CalendarDays size={15} /></a><a className="text-link" href={TWO_GIS_HREF} target="_blank" rel="noreferrer">Построить маршрут <Navigation size={15} /></a></div><div className="social-row"><a href="https://instagram.com/arqa_avto_kompleks" target="_blank" rel="noreferrer"><Instagram size={16} /> @arqa_avto_kompleks</a><span>Оплата: карта · наличные · перевод · QR</span></div></div></div></section>
      </main>

      {lightbox && <Suspense fallback={<div className="lightbox-loading" role="status">Открываем фото…</div>}><ArqaLightbox image={lightbox} onClose={() => setLightbox(null)} /></Suspense>}

      {/* Thumb-reachable primary actions on phones: appears once the hero is scrolled past. */}
      <div className={`mobile-bar ${hasScrolled && !mobileMenuOpen && !lightbox ? "is-visible" : ""}`} aria-hidden={!hasScrolled || mobileMenuOpen || Boolean(lightbox)}>
        <a href={PHONE_HREF} tabIndex={hasScrolled && !mobileMenuOpen && !lightbox ? undefined : -1}><Phone size={17} /> Позвонить</a>
        <a className="mobile-bar-wa" href={WHATSAPP_HREF} target="_blank" rel="noreferrer" tabIndex={hasScrolled && !mobileMenuOpen && !lightbox ? undefined : -1}><MessageCircle size={17} /> WhatsApp</a>
      </div>

      <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><img className="footer-logo" src={LOGO_DARK} alt="ARQA" width={164} height={58} /><div><span>Автосервис в Кокшетау</span></div></div><p>Точный сервис для живых дорог.<br /><span>Факты актуальны по открытым данным 2GIS на 15.09.2026.</span></p><div className="footer-links"><a href={TWO_GIS_HREF} target="_blank" rel="noreferrer">2GIS <ExternalLink size={13} /></a><a href="https://instagram.com/arqa_avto_kompleks" target="_blank" rel="noreferrer">Instagram <ExternalLink size={13} /></a></div></div></footer>
    </div>
  );
}
