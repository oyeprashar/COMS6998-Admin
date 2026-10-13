
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Vote = {
    id: string;
    voter_email: string;
    caption_text: string | null;
    vote: number;
    created_at: string;
};

export default async function VotesPage() {
    const supabase = await createClient();

    // Step 1: Verify authentication.
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        redirect("/");
    }

    // Step 2: Verify superadmin privileges.
    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_superadmin");

    if (adminError || isAdmin !== true) {
        redirect("/unauthorized");
    }

    // Step 3: Fetch voting activity.
    const { data, error } = await supabase.rpc(
        "admin_list_votes"
    );

    if (error) {
        console.error("Failed to fetch votes:", error.message);
    }

    const votes = (data ?? []) as Vote[];

    const upvotes = votes.filter(
        (item) => item.vote === 1
    ).length;

    const downvotes = votes.filter(
        (item) => item.vote === -1
    ).length;

    return (
        <main className="min-h-screen bg-black p-6 text-white md:p-12">
            <div className="mx-auto max-w-6xl">

                {/* Back Navigation */}
                <Link
                    href="/dashboard"
                    className="text-purple-400 hover:underline"
                >
                    ← Back to Dashboard
                </Link>

                {/* Header */}
                <div className="mb-8 mt-7">
                    <p className="text-sm uppercase tracking-widest text-purple-400">
                        Caption Battle
                    </p>

                    <h1 className="mt-2 text-4xl font-bold">
                        Voting Management
                    </h1>

                    <p className="mt-3 text-gray-400">
                        View community upvotes and downvotes.
                    </p>
                </div>

                {error ? (
                    <p className="rounded-xl border border-red-900 p-5 text-red-400">
                        Unable to load voting activity.
                    </p>
                ) : (
                    <>
                        {/* Statistics */}
                        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                                <p className="text-gray-400">
                                    Displayed Votes
                                </p>
                                <p className="mt-3 text-3xl font-bold">
                                    {votes.length}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                                <p className="text-green-400">
                                    Upvotes
                                </p>
                                <p className="mt-3 text-3xl font-bold">
                                    {upvotes}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                                <p className="text-red-400">
                                    Downvotes
                                </p>
                                <p className="mt-3 text-3xl font-bold">
                                    {downvotes}
                                </p>
                            </div>
                        </div>

                        {/* Voting Table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-800">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900 text-gray-400">
                                <tr>
                                    <th className="p-4">
                                        Voter
                                    </th>
                                    <th className="p-4">
                                        Caption
                                    </th>
                                    <th className="p-4">
                                        Vote
                                    </th>
                                    <th className="p-4">
                                        Date
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {votes.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-gray-800"
                                    >
                                        <td className="p-4">
                                            {item.voter_email}
                                        </td>

                                        <td className="max-w-md p-4">
                                            {item.caption_text ?? "Caption unavailable"}
                                        </td>

                                        <td className="p-4">
                                            {item.vote === 1 ? (
                                                <span className="font-medium text-green-400">
                                                        ▲ Upvote
                                                    </span>
                                            ) : (
                                                <span className="font-medium text-red-400">
                                                        ▼ Downvote
                                                    </span>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap p-4 text-gray-400">
                                            {new Date(
                                                item.created_at
                                            ).toLocaleString(
                                                "en-US",
                                                {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                    timeZone: "UTC",
                                                }
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {votes.length === 0 && (
                                <p className="p-8 text-center text-gray-400">
                                    No votes found.
                                </p>
                            )}
                        </div>

                        <p className="mt-4 text-sm text-gray-500">
                            Showing up to 200 most recent votes.
                            All times are UTC.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
