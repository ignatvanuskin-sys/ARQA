import { ExternalLink, X } from "lucide-react";

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
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр фотографии" onClick={onClose}>
      <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Закрыть просмотр">
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
