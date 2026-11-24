"use client";

import { useState } from "react";

export function ProductGallery({ images, name, fallback }: { images: { url: string; alt: string | null }[]; name: string; fallback: React.ReactNode }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return <div className="card aspect-[4/3] overflow-hidden bg-surface">{fallback}</div>;
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div>
      <div className="card aspect-[4/3] overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt ?? name} className="h-full w-full object-contain p-3" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Fotos do produto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-current={i === active ? "true" : undefined}
                className={`block aspect-[4/3] w-full overflow-hidden rounded-xl border bg-white transition ${i === active ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-brand/50"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
