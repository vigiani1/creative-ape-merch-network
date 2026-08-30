"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next ?? "/portal"} />
      <label className="grid gap-2 text-sm font-semibold">
        Email address
        <input className="rounded-xl border border-black/15 px-4 py-3 font-normal" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Password
        <input className="rounded-xl border border-black/15 px-4 py-3 font-normal" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{state.error}</p> : null}
      <button disabled={pending} className="rounded-xl bg-black px-5 py-3 font-bold text-white disabled:opacity-50" type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
