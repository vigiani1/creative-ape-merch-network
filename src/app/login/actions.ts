"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

function safeDestination(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/portal";
  return value === "/admin" || value.startsWith("/admin/") || value === "/portal" || value.startsWith("/portal/")
    ? value
    : "/portal";
}

export async function signIn(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { error: "The email address or password is incorrect." };

  redirect(safeDestination(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
