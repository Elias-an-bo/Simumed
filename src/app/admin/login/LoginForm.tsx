"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="card mt-8 grid gap-4 p-6">
      {state.error && (
        <p role="alert" id="login-erro" className="rounded-[var(--radius-control)] bg-[#fdecec] p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state.email} key={state.email ?? ""} />
      </div>
      <div>
        <label htmlFor="password" className="label">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <button type="submit" className="btn btn-primary h-12" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Entrar
      </button>
    </form>
  );
}
