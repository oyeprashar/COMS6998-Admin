
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/logout/actions";
import Link from "next/link";

type Caption = {
    text: string;
    score: number;
};

type DashboardStats = {
    total_users: number;
    total_images: number;
    total_captions: number;
    total_votes: number;
    upvotes: number;
    downvotes: number;
    top_captions: Caption[];
};

export default async function Dashboard() {
    await connection();

    const supabase = await createClient();

    // Verify authentication.
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        redirect("/");
    }

    // Verify superadmin privileges.
    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_superadmin");

    if (adminError || isAdmin !== true) {
        redirect("/unauthorized");
    }

    // Fetch dashboard statistics.
    const { data, error } = await supabase.rpc(
        "admin_dashboard_stats"
    );

    if (error || !data) {
        console.error("Dashboard statistics error:", error);

        return (
            <main className="min-h-screen bg-black p-10 text-white">
                <h1 className="text-3xl font-bold">
                    Unable to load dashboard statistics
                </h1>

                <p className="mt-4 text-gray-400">
                    Please check Supabase and try again.
                </p>
            </main>
        );
    }

    const stats = data as DashboardStats;

    const cards = [
        { title: "Total Users", value: stats.total_users },
        { title: "Images", value: stats.total_images },
        { title: "AI Captions", value: stats.total_captions },
        { title: "Total Votes", value: stats.total_votes },
    ];

    const averageCaptions =
        stats.total_images > 0
            ? (stats.total_captions / stats.total_images).toFixed(2)
            : "0";

    const positivePercentage =
        stats.total_votes > 0
            ? (stats.upvotes / stats.total_votes) * 100
            : 0;

    return (
        <main className="min-h-screen bg-black p-8 text-white md:p-12">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-purple-400">
                            Caption Battle
                        </p>

                        <h1 className="mt-2 text-4xl font-bold">
                            Admin Dashboard
                        </h1>

                        <p className="mt-3 text-gray-400">
                            Signed in as {userData.user.email}
                        </p>
                    </div>

                    <form action={logout}>
                        <button
                            type="submit"
                            className="rounded-lg border border-gray-700 px-5 py-2 hover:bg-gray-900"
                        >
                            Logout
                        </button>
                    </form>
                </header>

                {/* Admin Navigation */}
                <nav className="mb-8 flex flex-wrap gap-4">
                    <Link
                        href="/dashboard/users"
                        className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950"
                    >
                        Manage Users →
                    </Link>

                    <Link
                        href="/dashboard/media"
                        className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950"
                    >
                        Manage Media →
                    </Link>

                    <Link
                        href="/dashboard/votes"
                        className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950"
                    >
                        View Votes →
                    </Link>
                    <Link
                        href="/dashboard/prompt-chains"
                        className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950"
                    >
                        View Prompt Chains →
                    </Link>
                    <Link
                        href="/dashboard/prompt-chain-mix"
                        className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950"
                    >
                        Prompt Chain Mix →
                    </Link>

                    <Link
                        href="/dashboard/terms"
                        className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950"
                    >
                        Manage Terms →
                    </Link>
                    <Link href="/dashboard/llm-providers" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">Manage LLM Providers →</Link>
                    <Link href="/dashboard/llm-models" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">Manage LLM Models →</Link>
                    <Link href="/dashboard/ai-generation-examples" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">Manage AI Generation Examples →</Link>
                    <Link href="/dashboard/generation-requests" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">View Generation Requests →</Link>
                    <Link href="/dashboard/llm-responses" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">View LLM Responses →</Link>
                    <Link href="/dashboard/ai-generated-media" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">View AI Generated Media →</Link>
                    <Link href="/dashboard/allowed-signup-domains" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">Allowed Signup Domains →</Link>
                    <Link href="/dashboard/whitelisted-email-addresses" className="rounded-lg border border-purple-500 px-5 py-3 text-purple-400 hover:bg-purple-950">Whitelisted Emails →</Link>
                </nav>

                {/* Statistics Cards */}
                <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => (
                        <div
                            key={card.title}
                            className="rounded-xl border border-gray-800 bg-zinc-950 p-6"
                        >
                            <p className="text-sm text-gray-400">
                                {card.title}
                            </p>

                            <p className="mt-3 text-4xl font-bold">
                                {card.value.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </section>

                {/* Voting and Content Statistics */}
                <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* Community Voting */}
                    <div className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                        <h2 className="mb-6 text-xl font-semibold">
                            Community Voting
                        </h2>

                        <div className="flex justify-between text-sm">
                            <span className="text-green-400">
                                Upvotes: {stats.upvotes}
                            </span>

                            <span className="text-red-400">
                                Downvotes: {stats.downvotes}
                            </span>
                        </div>

                        <div className="mt-4 flex h-5 overflow-hidden rounded-full bg-gray-800">
                            <div
                                className="bg-green-500"
                                style={{
                                    width: `${positivePercentage}%`,
                                }}
                            />

                            <div
                                className="bg-red-500"
                                style={{
                                    width: `${100 - positivePercentage}%`,
                                }}
                            />
                        </div>

                        <p className="mt-4 text-sm text-gray-400">
                            {positivePercentage.toFixed(1)}% of votes are positive
                        </p>
                    </div>

                    {/* Content Statistics */}
                    <div className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                        <h2 className="mb-6 text-xl font-semibold">
                            Content Statistics
                        </h2>

                        <p className="text-gray-400">
                            Average captions generated per image
                        </p>

                        <p className="mt-4 text-5xl font-bold text-purple-400">
                            {averageCaptions}
                        </p>
                    </div>
                </section>

                {/* Top Captions */}
                <section className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                    <h2 className="mb-6 text-xl font-semibold">
                        Top 5 Captions
                    </h2>

                    {stats.top_captions.length === 0 ? (
                        <p className="text-gray-400">
                            No captions available yet.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {stats.top_captions.map((caption, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-5 rounded-lg border border-gray-800 p-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="font-bold text-purple-400">
                                            #{index + 1}
                                        </span>

                                        <p>{caption.text}</p>
                                    </div>

                                    <span className="shrink-0 font-semibold text-green-400">
                                        {caption.score} net votes
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
