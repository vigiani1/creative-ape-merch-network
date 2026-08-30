export function SetupRequired({ area }: { area: string }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
      <p className="font-bold">{area} is ready for configuration.</p>
      <p className="mt-2 text-sm leading-6">Add the Supabase values from `.env.example` to `.env.local`, apply the initial migration, then reload this page.</p>
    </div>
  );
}
