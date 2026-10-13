"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function Home() {
  const [error, setError] = useState("");

  async function signIn() {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white">
        <h1 className="text-4xl font-bold">
          Caption Battle Admin
        </h1>

        <p className="text-gray-400">
          Sign in to access the admin dashboard.
        </p>

        <button
            onClick={signIn}
            className="rounded-lg bg-white px-6 py-3 font-medium text-black"
        >
          Sign in with Google
        </button>

        {error && <p className="text-red-400">{error}</p>}
      </main>
  );
}