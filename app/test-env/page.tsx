export default function TestEnvPage() {
  const supabaseUrlOk = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  const supabaseKeyOk = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-black">
          Test Supabase
        </h1>

        <p className="text-lg text-black">
          URL Supabase : {supabaseUrlOk ? "OK" : "MANQUANTE"}
        </p>

        <p className="text-lg text-black">
          Cle Supabase : {supabaseKeyOk ? "OK" : "MANQUANTE"}
        </p>
      </div>
    </main>
  );
}
