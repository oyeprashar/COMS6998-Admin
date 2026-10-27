
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import MediaManager, { type MediaItem } from "./media-manager";

export default async function MediaPage() {
    const supabase = await createClient();

    // Step 1: Verify the user is authenticated.
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        redirect("/");
    }

    // Step 2: Verify the user is a superadmin.
    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin_member");

    if (adminError || isAdmin !== true) {
        redirect("/unauthorized");
    }

    // Step 3: Fetch all images and their captions.
    const { data, error } = await supabase.rpc(
        "admin_list_media"
    );

    if (error) {
        console.error(
            "Failed to load media:",
            error.message
        );
    }

    const images = (data ?? []) as MediaItem[];

    // Step 4: Generate signed URLs for private images.
    // Each URL remains valid for one hour.
    const media = await Promise.all(
        images.map(async (image) => {
            const { data: urlData, error: urlError } =
                await supabase.storage
                    .from("caption-images")
                    .createSignedUrl(
                        image.storage_path,
                        3600
                    );

            if (urlError) {
                console.error(
                    "Image URL error:",
                    urlError.message
                );
            }

            return {
                ...image,
                image_url: urlData?.signedUrl ?? "",
            };
        })
    );

    return (
        <main className="min-h-screen bg-black p-6 text-white md:p-12">
            <div className="mx-auto max-w-6xl">

                {/* Back navigation */}
                <Link
                    href="/dashboard"
                    className="text-purple-400 hover:underline"
                >
                    ← Back to Dashboard
                </Link>

                {/* Page heading */}
                <div className="mb-8 mt-7">
                    <p className="text-sm uppercase tracking-widest text-purple-400">
                        Caption Battle
                    </p>

                    <h1 className="mt-2 text-4xl font-bold">
                        Media Management
                    </h1>

                    <p className="mt-3 text-gray-400">
                        Manage uploaded images and AI-generated captions.
                    </p>
                </div>

                {/* Media management interface */}
                {error ? (
                    <p className="rounded-lg border border-red-900 p-5 text-red-400">
                        Failed to retrieve media from Supabase.
                    </p>
                ) : (
                    <MediaManager media={media} />
                )}

            </div>
        </main>
    );
}
