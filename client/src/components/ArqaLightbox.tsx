import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";

type LightboxImage = {
  path: string;
  title: string;
  label: string;
};

type ArqaLightboxProps = {
  image: LightboxImage;
  onClose: () => void;
};

export default function ArqaLightbox({ image, onClose }: ArqaLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep Tab cycling inside the dialog.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр фотографии" onClick={onClose}>
      <div className="lightbox-card" ref={dialogRef} onClick={(event) => event.stopPropagation()} onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }} onTouchEnd={(event) => { const start = touchStartY.current; const end = event.changedTouches[0]?.clientY ?? start; touchStartY.current = null; if (start !== null && end !== null && end - start > 70) onClose(); }}>
        <button ref={closeRef} className="lightbox-close" onClick={onClose} aria-label="Закрыть просмотр">
          <X size={20} />
        </button>
        <div className="lightbox-art lightbox-photo">
          <img src={image.path} alt={image.label} />
          <div className="lightbox-caption">
            <span>{image.title}</span>
            <strong>{image.label}</strong>
            <a href="https://2gis.kz/kokshetau/gallery/firm/70000001068594936" target="_blank" rel="noreferrer">
              Источник: галерея 2GIS <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
