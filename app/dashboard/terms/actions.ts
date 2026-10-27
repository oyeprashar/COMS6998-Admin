"use server";

import { requireAdminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fields(formData: FormData) {
  const term = formData.get("term");
  const description = formData.get("description");
  const active = formData.get("is_active");
  if (typeof term !== "string" || !term.trim() || term.trim().length > 200) throw new Error("Term must contain 1–200 characters");
  if (typeof description !== "string" || description.length > 5000) throw new Error("Description is invalid");
  return { term: term.trim(), description: description.trim() || null, is_active: active === "on" };
}
function idFrom(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid term ID");
  return id;
}
function finish(status: "created" | "updated" | "deleted") {
  revalidatePath("/dashboard/terms");
  redirect(`/dashboard/terms?success=${status}`);
}
export async function createTerm(formData: FormData) {
  const supabase = await requireAdminAction();
  const { error } = await supabase.from("terms").insert(fields(formData));
  if (error) {
    if (error.code === "23505") redirect("/dashboard/terms?error=duplicate");
    redirect("/dashboard/terms?error=save");
  }
  finish("created");
}
export async function updateTerm(formData: FormData) {
  const supabase = await requireAdminAction();
  const id = idFrom(formData);
  const { data, error } = await supabase.from("terms").update(fields(formData)).eq("id", id).select("id");
  if (error) {
    if (error.code === "23505") redirect("/dashboard/terms?error=duplicate");
    redirect("/dashboard/terms?error=save");
  }
  if (!data?.length) redirect("/dashboard/terms?error=not_found");
  finish("updated");
}
export async function deleteTerm(formData: FormData) {
  const supabase = await requireAdminAction();
  const id = idFrom(formData);
  const { data, error } = await supabase.from("terms").delete().eq("id", id).select("id");
  if (error) redirect("/dashboard/terms?error=save");
  if (!data?.length) redirect("/dashboard/terms?error=not_found");
  finish("deleted");
}
