import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/logout/actions";

export default async function Dashboard() {
    const supabase = await createClient();

    // Verify the authenticated user.
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        redirect("/");
    }

    // Verify the user has superadmin privileges.
    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_superadmin");

    if (adminError) {
        console.error("Admin verification failed:", adminError.message);
    }

    if (adminError || isAdmin !== true) {
        redirect("/unauthorized");
    }

    return (
        <main className="min-h-screen bg-black p-12 text-white">
            <h1 className="text-3xl font-bold">
                Caption Battle Admin Dashboard
            </h1>

            <p className="mt-4 text-gray-400">
                Logged in as {userData.user.email}
            </p>

            <form action={logout}>
                <button
                    type="submit"
                    className="mt-8 rounded-lg bg-white px-5 py-2 text-black"
                >
                    Logout
                </button>
            </form>
        </main>
    );
}