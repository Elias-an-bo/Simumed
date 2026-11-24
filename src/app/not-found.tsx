import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="Simumed — página inicial">
        <Logo />
      </Link>
      <h1 className="mt-10 text-[32px] font-bold">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-muted">O endereço pode ter mudado ou o produto saiu do catálogo. Use a busca ou volte para o início.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/produtos" className="btn btn-primary">
          Ver produtos
        </Link>
        <Link href="/" className="btn btn-secondary">
          Página inicial
        </Link>
      </div>
    </div>
  );
}
