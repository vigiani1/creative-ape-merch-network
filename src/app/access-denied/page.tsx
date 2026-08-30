import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em]">Creative Ape</p>
        <h1 className="mt-3 text-3xl font-black">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">Your account does not have access to this area. Contact an administrator if you believe this is a mistake.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-xl border border-black/15 px-5 py-3 font-semibold">Return home</Link>
          <form action={signOut}><button type="submit" className="rounded-xl bg-black px-5 py-3 font-semibold text-white">Sign out</button></form>
        </div>
      </div>
    </main>
  );
}
