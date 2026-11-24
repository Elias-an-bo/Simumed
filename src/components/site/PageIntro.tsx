import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export function PageIntro({ title, description, crumb, eyebrow }: { title: string; description?: string; crumb: string; eyebrow?: string }) {
  return (
    <section className="border-b border-line bg-gradient-to-b from-surface to-white">
      <div className="container-site py-10 md:py-14">
        <Breadcrumbs items={[{ href: "/", label: "Início" }, { label: crumb }]} />
        {eyebrow && <p className="mt-6 text-sm font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</p>}
        <h1 className={`${eyebrow ? "mt-2" : "mt-6"} max-w-3xl text-[32px] font-extrabold sm:text-[44px]`}>{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[18px] text-muted">{description}</p>}
      </div>
    </section>
  );
}
