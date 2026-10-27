
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
        await supabase.rpc("is_admin_member");

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



export async function createImage(formData: FormData) {
    const supabase = await requireAdmin();

    const file = formData.get("image");
    const description = formData.get("description");

    if (!(file instanceof File)) {
        throw new Error("Please select an image");
    }

    if (typeof description !== "string") {
        throw new Error("Invalid description");
    }

    const allowedTypes: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    };

    const extension = allowedTypes[file.type];

    if (!extension) {
        throw new Error("Only JPG, PNG, and WEBP are supported");
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be between 1 byte and 5 MB");
    }

    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData.user) {
        throw new Error("Authentication required");
    }

    const imageId = crypto.randomUUID();

    const storagePath =
        `${userData.user.id}/${imageId}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from("caption-images")
        .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        throw new Error(uploadError.message);
    }

    const { error: databaseError } = await supabase.rpc(
        "admin_create_image",
        {
            p_storage_path: storagePath,
            p_description: description.trim(),
        }
    );

    if (databaseError) {
        // Attempt to clean up an uploaded file if DB insertion failed.
        const { error: cleanupError } = await supabase.storage
            .from("caption-images")
            .remove([storagePath]);

        if (cleanupError) {
            console.error(
                "Orphaned upload requires cleanup:",
                storagePath,
                cleanupError.message
            );
        }

        throw new Error(databaseError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/media");

    redirect("/dashboard/media?status=image_created");
}


export async function deleteImage(formData: FormData) {
    const supabase = await requireAdmin();

    const imageId = getUUID(formData, "image_id");

    const { data: storagePath, error: databaseError } =
        await supabase.rpc("admin_delete_image", {
            p_image_id: imageId,
        });

    if (databaseError) {
        throw new Error(databaseError.message);
    }

    if (
        typeof storagePath !== "string" ||
        storagePath.length === 0
    ) {
        throw new Error(
            "Image deleted, but no storage path was returned"
        );
    }

    const { error: storageError } = await supabase.storage
        .from("caption-images")
        .remove([storagePath]);

    if (storageError) {
        console.error(
            "Storage cleanup failed:",
            storagePath,
            storageError.message
        );

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/media");

        throw new Error(
            "Database record was deleted, but the image file " +
            "could not be removed from Storage. " +
            "Manual cleanup is required."
        );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/media");

    redirect("/dashboard/media?status=image_deleted");
}
