export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</p>}
      <h2 className="text-[28px] font-bold sm:text-[36px]">{title}</h2>
      {description && <p className="mt-3 text-[17px] text-muted">{description}</p>}
    </div>
  );
}
