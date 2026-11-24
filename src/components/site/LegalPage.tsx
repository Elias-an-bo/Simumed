import { PageIntro } from "./PageIntro";

/** Página de texto (políticas, institucional). Textos-base: revisar com o dono/assessoria antes de publicar. */
export function TextPage({ title, crumb, description, updated, children }: { title: string; crumb: string; description?: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <PageIntro crumb={crumb} title={title} description={description} />
      <article className="container-site py-10 md:py-14">
        <div className="prose-simumed max-w-3xl text-[16px] leading-relaxed">
          {children}
          {updated && <p className="mt-10 text-sm text-muted">Última atualização: {updated}.</p>}
        </div>
      </article>
    </>
  );
}
