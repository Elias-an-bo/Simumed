import { categoryIcon } from "@/lib/catalog/icons";

export function ProductVisual({
  image,
  name,
  rootSlug,
  categoryName,
  size = "card",
}: {
  image?: { url: string; alt: string | null } | null;
  name: string;
  rootSlug: string;
  categoryName: string;
  size?: "card" | "page";
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={image.alt ?? name}
        loading={size === "page" ? "eager" : "lazy"}
        className="h-full w-full object-contain p-4 mix-blend-multiply"
      />
    );
  }
  const Icon = categoryIcon(rootSlug);
  return (
    <div
      role="img"
      aria-label={`${name} — foto em breve`}
      className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-brand-soft"
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden="true">
        <defs>
          <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0H0V22" fill="none" stroke="#0b7a72" strokeOpacity="0.18" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <span className="relative flex items-center justify-center rounded-2xl bg-white/80 p-4 shadow-[var(--shadow-rest)]">
        <Icon className={size === "page" ? "size-16 text-brand" : "size-10 text-brand"} strokeWidth={1.4} aria-hidden />
      </span>
      <span className="relative text-xs font-semibold uppercase tracking-[0.1em] text-brand/80">{categoryName}</span>
    </div>
  );
}
