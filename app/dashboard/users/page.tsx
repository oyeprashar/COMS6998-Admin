
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type User = {
    id: string;
    email: string;
    display_name: string;
    created_at: string;
    provider: string;
    is_superadmin: boolean;
};

export default async function UsersPage() {
    await connection();

    const supabase = await createClient();

    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        redirect("/");
    }

    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_superadmin");

    if (adminError || isAdmin !== true) {
        redirect("/unauthorized");
    }

    const { data, error } =
        await supabase.rpc("admin_list_users");

    if (error) {
        console.error("Unable to fetch users:", error.message);
    }

    const users = (data ?? []) as User[];

    return (
        <main className="min-h-screen bg-black p-8 text-white md:p-12">
            <div className="mx-auto max-w-6xl">

                <Link
                    href="/dashboard"
                    className="text-sm text-purple-400 hover:underline"
                >
                    ← Back to Dashboard
                </Link>

                <h1 className="mt-6 text-3xl font-bold">
                    User Management
                </h1>

                <p className="mt-2 text-gray-400">
                    View registered users and administrator privileges.
                </p>

                {error ? (
                    <p className="mt-8 text-red-400">
                        Failed to load users.
                    </p>
                ) : (
                    <div className="mt-8 overflow-x-auto rounded-xl border border-gray-800">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-900 text-gray-400">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Provider</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4">Role</th>
                            </tr>
                            </thead>

                            <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-t border-gray-800"
                                >
                                    <td className="p-4">
                                        {user.display_name}
                                    </td>

                                    <td className="p-4">
                                        {user.email}
                                    </td>

                                    <td className="p-4">
                                        {user.provider}
                                    </td>

                                    <td className="p-4">
                                        {new Date(user.created_at)
                                            .toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                timeZone: "UTC",
                                            })}
                                    </td>

                                    <td className="p-4">
                                            <span
                                                className={
                                                    user.is_superadmin
                                                        ? "text-purple-400"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {user.is_superadmin
                                                    ? "Superadmin"
                                                    : "User"}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {users.length === 0 && (
                            <p className="p-6 text-center text-gray-400">
                                No registered users found.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
