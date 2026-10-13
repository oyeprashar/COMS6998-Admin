
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function Home() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function signIn() {
        setError("");
        setLoading(true);

        const supabase = createClient();

        const redirectUrl =
            `${window.location.origin}/auth/callback`;

        const { error: signInError } =
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                },
            });

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-white">
            <h1 className="text-center text-4xl font-bold">
                Caption Battle Admin
            </h1>

            <p className="text-center text-gray-400">
                Sign in to access the admin dashboard.
            </p>

            <button
                onClick={signIn}
                disabled={loading}
                className="rounded-lg bg-white px-6 py-3 font-medium text-black hover:bg-gray-200 disabled:opacity-50"
            >
                {loading ? "Redirecting to Google..." : "Sign in with Google"}
            </button>

            {error && (
                <p className="text-center text-red-400">
                    {error}
                </p>
            )}
        </main>
    );
}
