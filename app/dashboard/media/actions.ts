
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
    const supabase = await createClient();

    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        throw new Error("Authentication required");
    }

    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_superadmin");

    if (adminError || isAdmin !== true) {
        throw new Error("Administrator access required");
    }

    return supabase;
}

function getRequiredString(formData: FormData, key: string) {
    const value = formData.get(key);

    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${key} is required`);
    }

    return value.trim();
}

function getUUID(formData: FormData, key: string) {
    const value = getRequiredString(formData, key);

    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(value)) {
        throw new Error(`Invalid ${key}`);
    }

    return value;
}

export async function createCaption(formData: FormData) {
    const supabase = await requireAdmin();

    const imageId = getUUID(formData, "image_id");
    const text = getRequiredString(formData, "text");

    const { error } = await supabase.rpc("admin_create_caption", {
        p_image_id: imageId,
        p_text: text,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard");
    redirect("/dashboard/media?status=created");
}

export async function updateCaption(formData: FormData) {
    const supabase = await requireAdmin();

    const captionId = getUUID(formData, "caption_id");
    const text = getRequiredString(formData, "text");

    const { error } = await supabase.rpc("admin_update_caption", {
        p_caption_id: captionId,
        p_text: text,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/media");
    redirect("/dashboard/media?status=updated");
}

export async function deleteCaption(formData: FormData) {
    const supabase = await requireAdmin();

    const captionId = getUUID(formData, "caption_id");

    const { error } = await supabase.rpc("admin_delete_caption", {
        p_caption_id: captionId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard");
    redirect("/dashboard/media?status=deleted");
}

export async function updateImage(formData: FormData) {
    const supabase = await requireAdmin();

    const imageId = getUUID(formData, "image_id");
    const descriptionValue = formData.get("description");

    if (typeof descriptionValue !== "string") {
        throw new Error("Invalid description");
    }

    const { error } = await supabase.rpc("admin_update_image", {
        p_image_id: imageId,
        p_description: descriptionValue.trim(),
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/media");
    redirect("/dashboard/media?status=updated");
}
