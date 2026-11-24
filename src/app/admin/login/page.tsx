import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Painel — entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold">Painel da loja</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
