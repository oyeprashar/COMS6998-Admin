import { logout } from "@/app/logout/actions";

export default function Unauthorized() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
            <h1 className="text-3xl font-bold">
                Access Denied
            </h1>

            <p className="text-gray-400">
                You do not have administrator privileges.
            </p>

            <form action={logout}>
                <button
                    type="submit"
                    className="rounded-lg bg-white px-5 py-2 text-black"
                >
                    Sign out
                </button>
            </form>
        </main>
    );
}