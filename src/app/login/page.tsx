import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em]">Creative Ape</p>
        <h1 className="mt-3 text-3xl font-black">Sign in</h1>
        <p className="mt-3 text-sm text-black/55">Use your organization or Creative Ape account.</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
